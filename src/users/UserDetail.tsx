import { Link, useParams } from "react-router-dom";
import useUserStore, { UserDetailStore } from "./userStore";
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { CertificateRequest, ChangeUserSecurityCommand, Passkey, UserActivation, UserCookie, UserDetail } from "../workers/connection.worker";
import { Formatters } from "millegrilles.reactdeps.typescript";
import ActionButton from "../components/ActionButton";

function UserDetailPage() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let users = useUserStore(state=>state.users);
    let {userId} = useParams();

    let [userDetail, setUserDetail] = useState(null as UserDetail | null);

    let user = useMemo(()=>{
        if(!users) return null;
        return users.filter(item=>item.userId===userId).pop();
    }, [users, userId]) as UserDetailStore | null;

    useEffect(()=>{
        if(!workers || !ready || !userId) return;  // Not ready
        workers.connection.getUserPasskeys(userId)
            .then(response=>{
                console.debug("User info: ", response);
                setUserDetail(response);
            })
            .catch(err=>console.error("getUserDetail Error", err));
    }, [workers, ready, userId]);

    return (
        <>
            <Link to='/coupdoeil2/users'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Users</h1>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>User detail</h2>

                <div className='grid grid-cols-1 lg:grid-cols-2'>
                    <p className='font-bold'>User name</p>
                    <p>{user?.nomUsager}</p>
                    <p className='font-bold'>User Id</p>
                    <p className='text-xs sm:text-base'>{user?.userId}</p>
                </div>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Actions on account</h2>

                <p className='pb-1'>Activate with code provided by the user.</p>
                <div className='grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 pb-4'>
                    <ActivateCode username={user?.nomUsager} />
                </div>

                <p className='pb-1'>Change user security level.</p>
                <UserSecurity value={user} />

            </section>

            <section className='pt-4'>
                <h2 className='text-lg font-bold pb-2'>Passkeys</h2>
                <div className='grid grid-cols-3'>
                    <p className='font-bold'>Hostname</p>
                    <p className='font-bold'>Created</p>
                    <p className='font-bold'>Last login</p>
                    <PasskeyList value={userDetail} />
                </div>
            </section>

            <section className='pt-4'>
                <h2 className='text-lg font-bold pb-2'>Browser activations</h2>
                <div className='grid grid-cols-1 md:grid-cols-3'>
                    <p className='font-bold md:col-span-2'>Fingerprint</p>
                    <p className='font-bold'>Created</p>
                    <ActivationList value={userDetail} />
                </div>
            </section>

            <section className='pt-4'>
                <h2 className='text-lg font-bold pb-2'>Sessions (cookies)</h2>
                <div className='grid grid-cols-3'>
                    <p className='font-bold'>Hostname</p>
                    <p className='font-bold'>Created</p>
                    <p className='font-bold'>Expires</p>
                    <CookiesList value={userDetail} />
                </div>
            </section>

            <section className='pt-10'>
                <h2 className='text-lg font-bold pb-2'>Live account eviction</h2>
                <p>This is used to remove user passkeys and sessions and forcibly evict anyone currently logged-in with the <span className='font-bold'>{user?.nomUsager}</span> account.</p>
                <EvictActions />
            </section>
        </>
    );
}

export default UserDetailPage;

function ActivateCode(props: {username?: string | null}) {

    let { username } = props;

    let [codeError, setCodeError] = useState('');

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let {userId} = useParams();

    let [code, setCode] = useState('');
    let [success, setSuccess] = useState(false);
    let codeChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
        setCodeError('');
        setSuccess(false);
        setCode(e.currentTarget.value)
    }, [setCode, setSuccess]);
    let buttonClassName = useMemo(()=>{
        if(success) return 'btn inline-block text-center bg-green-700 hover:bg-green-600 active:bg-green-500 disabled:bg-green-800';
        if(codeError) return 'btn inline-block text-center bg-red-700 hover:bg-red-600 active:bg-red-500 disabled:bg-red-800';
        return 'btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800';
    }, [codeError, success]);

    let activateHandler = useCallback(()=>{
        if(!workers || !ready) throw new Error("workers not initialized");
        Promise.resolve().then(async () => {
            if(!workers) throw new Error("workers not initialized");
            if(!userId) throw new Error("userId not provided");
            if(!username) throw new Error("username not provided");

            let formattedCode = formatActivationCode(code);
            let codeResponse = await workers.connection.verifyActivationCode(username, formattedCode);
            console.debug("Code response: ", codeResponse);
            let csr = codeResponse.csr;
            if(!csr) {
                throw new Error(`activateHandler Error verifying activation code: ${codeResponse.err}`);
            }
            let currentDate = Math.floor(new Date().getTime() / 1000);  // Epoch seconds
            let request = {nomUsager: username, csr, date: currentDate, activationTierce: true} as CertificateRequest;
            let activationResponse = await workers.connection.activateAccountByAdmin(userId, request);
            console.debug("Activation response", activationResponse);
            if(activationResponse.ok) {
                setSuccess(true);
                setCodeError('');
                setCode(''); // Reset code
            } else {
                setCodeError(activationResponse.err || 'Error');
            }
        })
        .catch(err=>{
            console.error("activateHandler Error ", err)
            setSuccess(false);
            setCodeError(''+err);
        });
    }, [workers, ready, code, userId, username, setCode, setCodeError, setSuccess]);

    return (
        <>
            <input type='text' value={code} onChange={codeChangeHandler} placeholder="Example: abcd-1234"
                className='text-black' maxLength={9} />
            <button onClick={activateHandler} disabled={!ready}
                className={buttonClassName}>
                    Activate
            </button>
        </>
    )
}

function PasskeyList(props: {value: UserDetail | null}) {

    let { value } = props;

    let passkeys = useMemo(()=>{
        if((!value?.passkeys) || value.passkeys.length === 0) return [<p>None</p>];
        let passkeysCopy = [...value.passkeys];
        passkeysCopy.sort(sortPasskeys);
        return passkeysCopy.map(item=>{
            return (
                <React.Fragment key={item.cred_id}>
                    <p>{item.hostname}</p>
                    <p><Formatters.FormatterDate value={item.date_creation} /></p>
                    <p><Formatters.FormatterDate value={item.dernier_auth} /></p>
                </React.Fragment>
            )
        });
    }, [value]);

    return (<>{passkeys}</>);
}

function ActivationList(props: {value: UserDetail | null}) {
    let { value } = props;

    let activations = useMemo(()=>{
        if((!value?.activations) || value.activations.length === 0) return [<p>None</p>];
        let activationsCopy = [...value.activations];
        activationsCopy.sort(sortuserActivations);
        return activationsCopy.map(item=>{
            return (
                <React.Fragment key={item.fingerprint_pk+item.date_creation}>
                    <p className='md:col-span-2 break-words'>{item.fingerprint_pk}</p>
                    <p><Formatters.FormatterDate value={item.date_creation} /></p>
                </React.Fragment>
            )
        });
    }, [value]);

    return (<>{activations}</>);
}

function CookiesList(props: {value: UserDetail | null}) {
    let { value } = props;

    let cookies = useMemo(()=>{
        if((!value?.cookies) || value.cookies.length === 0) return [<p>None</p>];
        let cookiesCopy = [...value.cookies];
        cookiesCopy.sort(sortCookies);
        return cookiesCopy.map(item=>{
            return (
                <React.Fragment key={item.hostname+item.date_creation}>
                    <p>{item.hostname}</p>
                    <p><Formatters.FormatterDate value={item.date_creation} /></p>
                    <p><Formatters.FormatterDate value={item.expiration} /></p>
                </React.Fragment>
            )
        });
    }, [value]);

    return (<>{cookies}</>);
}

function EvictActions() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let {userId} = useParams();

    let [waiting, setWaiting] = useState(false);

    let [deletePasskeys, setDeletePasskeys] = useState(false);
    let deletePasskeysChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
        setDeletePasskeys(e.currentTarget.checked)
    }, [setDeletePasskeys]);
    let [deleteSessions, setDeleteSessions] = useState(false);
    let deleteSessionsChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
        setDeleteSessions(e.currentTarget.checked)
    }, [setDeleteSessions]);

    let evictHandler = useCallback(async () => {
        if(!workers || !ready) throw new Error("workers not initialized");
        if(!deletePasskeys && !deleteSessions) throw new Error("No action required");
        if(!userId) throw new Error("UserId not provided");

        setWaiting(true);
        let response = await workers.connection.evictUser(userId, deletePasskeys, deleteSessions)
        console.debug("evictUser Response");
        if(!response.ok) {
            throw new Error('Error evicting user: ' + response.err);
        }
    }, [workers, ready, deletePasskeys, deleteSessions, userId, setWaiting]);

    return (
        <>
            <div className='pt-2 pl-6'>
                <input id='deletePasskeys' type='checkbox' checked={deletePasskeys} onChange={deletePasskeysChangeHandler} />
                <label htmlFor='deletePasskeys' className='pl-2'>Delete all passkeys and browser activations for the user account.</label>
            </div>

            <div className='pt-2 pl-6'>
                <input id='deleteSessions' type='checkbox' checked={deleteSessions} onChange={deleteSessionsChangeHandler} />
                <label htmlFor='deleteSessions' className='pl-2'>Evict all current sessions for the user account.</label>
            </div>

            <ActionButton onClick={evictHandler} disabled={waiting || !ready || (!deletePasskeys && !deleteSessions)}>
                Apply
            </ActionButton>
        </>        
    )
}

function sortPasskeys(a: Passkey, b: Passkey) {
    if(a === b) return 0;
    let comp = a.hostname.localeCompare(b.hostname);
    if(comp !== 0) return comp;
    return a.date_creation-b.date_creation;
}

function sortCookies(a: UserCookie, b: UserCookie) {
    if(a === b) return 0;
    let comp = a.hostname.localeCompare(b.hostname);
    if(comp !== 0) return comp;
    return a.date_creation-b.date_creation;
}

function sortuserActivations(a: UserActivation, b: UserActivation) {
    if(a === b) return 0;
    return a.date_creation-b.date_creation;
}

function formatActivationCode(code: string) {
    let codeClean = code.replaceAll('-', '');
    if(codeClean.length !== 8) {
        throw new Error('invalid activation code');
    }
    let code1 = codeClean.slice(0, 4);
    let code2 = codeClean.slice(4);
    return [code1, code2].join('-');
}

function UserSecurity(props: {value: UserDetailStore | null}) {

    let { value } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [security, setSecurity] = useState('');
    let [changed, setChanged] = useState(false);

    let securityOnChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        let newSecurity = e.currentTarget.value;
        if(newSecurity !== security) {
            setChanged(true);
            setSecurity(newSecurity);
        }
    }, [security, setChanged, setSecurity]);

    let changeSecurity = useCallback(async () => {
        if(!workers || !ready) throw new Error("workers not initialized");
        if(!security) throw new Error('Security level not provided');
        if(!value) throw new Error("User information not provided");

        let userId = value.userId;
        let command = {userId} as ChangeUserSecurityCommand;
        if(security === '1.public') {
            command.delegation_globale = null;
            command.compte_prive = null;
        } else if(security === '2.prive') {
            command.delegation_globale = null;
            command.compte_prive = true;
        } else if(security === '3.protege') {
            command.delegation_globale = 'proprietaire';
            command.compte_prive = null;
        }
        
        let response = await workers.connection.changeUserSecurity(command)
        console.debug("changeUserSecurity Response ", response);
        if(!response.userId) {
            throw new Error("Error changing security: " + response.err);
        }
    }, [workers, ready, value, security]);

    useEffect(()=>{
        if(!value) return setSecurity('');
        if(value.delegation_globale === 'proprietaire') {
            setSecurity('3.protege');
        } else if(value.compte_prive) {
            setSecurity('2.prive');
        } else {
            setSecurity('1.public');
        }
    }, [setSecurity, value]);

    return (
        <>
            <ul className="items-center w-full text-sm font-medium text-slate-900 bg-slate-400 border border-slate-800 rounded-lg md:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <li className="w-full border-b border-slate-800 sm:border-b-0 sm:border-r dark:border-gray-600">
                    <div className="flex items-center ps-3">
                        <input id="horizontal-list-1" type="radio" value="1.public" checked={security==='1.public'} onChange={securityOnChangeHandler} name="list-radio" 
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                        <label htmlFor="horizontal-list-1" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            Public resources only (1.public)
                        </label>
                    </div>
                </li>
                <li className="w-full border-b border-slate-800 sm:border-b-0 sm:border-r dark:border-gray-600">
                    <div className="flex items-center ps-3">
                        <input id="horizontal-list-2" type="radio" value="2.prive" checked={security==='2.prive'} onChange={securityOnChangeHandler} name="list-radio" 
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                        <label htmlFor="horizontal-list-2" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            Private applications (2.prive)
                        </label>
                    </div>
                </li>
                <li className="w-full border-b border-slate-800 sm:border-b-0 sm:border-r dark:border-gray-600">
                    <div className="flex items-center ps-3">
                        <input id="horizontal-list-3" type="radio" value="3.protege" checked={security==='3.protege'} onChange={securityOnChangeHandler} name="list-radio" 
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                        <label htmlFor="horizontal-list-3" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            Administrator (3.protege)
                        </label>
                    </div>
                </li>
            </ul>
            <ActionButton onClick={changeSecurity} disabled={!ready || !changed}>
                Change security
            </ActionButton>
        </>
    )
}

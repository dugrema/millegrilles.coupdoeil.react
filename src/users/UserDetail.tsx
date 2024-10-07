import { Link, useParams } from "react-router-dom";
import useUserStore, { UserDetailStore } from "./userStore";
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { Passkey, UserCookie, UserDetail } from "../workers/connection.worker";
import { Formatters } from "millegrilles.reactdeps.typescript";

function UserDetailPage() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let users = useUserStore(state=>state.users);
    let {userId} = useParams();

    let [userDetail, setUserDetail] = useState(null as UserDetail | null);

    let user = useMemo(()=>{
        if(!users) return null;
        return users.filter(item=>item.userId===userId).pop();
    }, [users]) as UserDetailStore | null;

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

                <div className='grid grid-cols-2'>
                    <p>User name</p>
                    <p>{user?.nomUsager}</p>
                    <p>User Id</p>
                    <p>{user?.userId}</p>
                </div>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>User security level</h2>
                
                <ul className="items-center w-full text-sm font-medium text-slate-900 bg-slate-400 border border-slate-800 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <li className="w-full border-b border-slate-800 sm:border-b-0 sm:border-r dark:border-gray-600">
                        <div className="flex items-center ps-3">
                            <input id="horizontal-list-1" type="radio" value="1.public" name="list-radio" 
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                            <label htmlFor="horizontal-list-1" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Public resources only (1.public)
                            </label>
                        </div>
                    </li>
                    <li className="w-full border-b border-slate-800 sm:border-b-0 sm:border-r dark:border-gray-600">
                        <div className="flex items-center ps-3">
                            <input id="horizontal-list-2" type="radio" value="2.prive" name="list-radio" 
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                            <label htmlFor="horizontal-list-2" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Private applications (2.prive)
                            </label>
                        </div>
                    </li>
                    <li className="w-full border-b border-slate-800 sm:border-b-0 sm:border-r dark:border-gray-600">
                        <div className="flex items-center ps-3">
                            <input id="horizontal-list-3" type="radio" value="3.protege" name="list-radio" 
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                            <label htmlFor="horizontal-list-3" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Administrator (3.protege)
                            </label>
                        </div>
                    </li>
                </ul>
                <button
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Change security
                </button>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Actions on account</h2>

                <p>Activate with code provided by the user.</p>
                <div className='grid grid-cols-6 pb-4'>
                    <ActivateCode />
                </div>
            </section>

            <section className='pt-4'>
                <h2 className='text-lg font-bold pb-2'>Passkeys</h2>
                <div className='grid grid-cols-4'>
                    <p className='font-bold'>Hostname</p>
                    <p className='font-bold'>Created</p>
                    <p className='font-bold'>Last login</p>
                    <p></p>
                    <PasskeyList value={userDetail} />
                </div>
            </section>

            <section className='pt-4'>
                <h2 className='text-lg font-bold pb-2'>Browser activations</h2>
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

                <p>This is used to remove user passkeys and sessions and forcibly evict anyone currently logged-in with this account.</p>

                <div className='pt-2 pl-6'>
                    <input id='deletePasskeys' type='checkbox'/>
                    <label htmlFor='deletePasskeys' className='pl-2'>Delete all passkeys for the user.</label>
                </div>

                <div className='pt-2 pl-6'>
                    <input id='deleteSessions' type='checkbox'/>
                    <label htmlFor='deleteSessions' className='pl-2'>Evict all current sessions for the user.</label>
                </div>

                <button
                    className='btn mt-4 inline-block text-center bg-red-700 hover:bg-red-600 active:bg-red-500 disabled:bg-red-800'>
                        Evict
                </button>

            </section>
        </>
    );
}

export default UserDetailPage;

function ActivateCode() {

    let [code, setCode] = useState('');
    let codeChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>setCode(e.currentTarget.value), [setCode]);

    return (
        <>
            <input type='text' value={code} onChange={codeChangeHandler} placeholder="Example: abcd-1234"
                className='text-black' />
            <button
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Activate
            </button>
        </>
    )
}

function PasskeyList(props: {value: UserDetail | null}) {

    let { value } = props;

    let passkeys = useMemo(()=>{
        if(!value?.passkeys) return [<></>];
        let passkeysCopy = [...value.passkeys];
        passkeysCopy.sort(sortPasskeys);
        return passkeysCopy.map(item=>{
            return (
                <React.Fragment key={item.cred_id+item.hostname+item.date_creation}>
                    <p>{item.hostname}</p>
                    <p><Formatters.FormatterDate value={item.date_creation} /></p>
                    <p><Formatters.FormatterDate value={item.dernier_auth} /></p>
                    <div>
                        <button 
                            className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                                Delete
                        </button>
                    </div>
                </React.Fragment>
            )
        });
    }, [value]);

    return (<>{passkeys}</>);
}

function CookiesList(props: {value: UserDetail | null}) {
    let { value } = props;

    let cookies = useMemo(()=>{
        if(!value?.cookies) return [<></>];
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

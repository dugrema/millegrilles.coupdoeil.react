import React, { Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { certificates } from "millegrilles.cryptography";
import { Formatters } from "millegrilles.reactdeps.typescript";

import { DiskInformation, ServerInstance } from "../workers/connection.worker";
import useInstanceStore from "./instanceStore";
import { InstanceInformation } from "./InstanceHttpConfiguration";
import useConnectionStore from "../connectionStore";
import ActionButton from "../components/ActionButton";
import useWorkers from "../workers/workers";
import { generateSatelliteCertificate } from "./InstanceAssociateNew";

function ShowInstanceInformation() {

    let { instanceId } = useParams();
    let instances = useInstanceStore(state=>state.instances);

    let instance = useMemo(()=>{
        if(!instances) return {};
        console.debug("Instances", instances);
        return instances.filter(item=>item.instance_id === instanceId).pop();
    }, [instances, instanceId]) as ServerInstance | null;
    
    return (
        <>
            <InstanceStorageInformation value={instance} />
            <InstanceCertificate value={instance} />
        </>
    );
}

export default ShowInstanceInformation;

export function InstanceStorageInformation(props: {value: ServerInstance | null | undefined}) {
    let { value } = props;

    let mounts = useMemo(()=>{
        if(!value || !value.disk) return [];

        let sorted = [...value.disk];
        sorted.sort((a: DiskInformation, b: DiskInformation)=>{
            if(a === b) return 0;
            return a.mountpoint.localeCompare(b.mountpoint);
        })

        return value.disk.map(item=>{

            let usedPct = Math.floor(item.used / item.total * 100);

            return (
                <React.Fragment key={item.mountpoint}>
                    <p className="col-span-3">{item.mountpoint}</p>
                    <div className="col-span-1">
                        <Formatters.FormatteurTaille value={item.total} />
                    </div>
                    <div className="w-11/12 mt-1 h-4 text-xs bg-gray-200 rounded-full dark:bg-gray-700">
                        <div className="h-4 bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{width: usedPct+'%'}}> {usedPct}%</div>
                    </div>
                    <div className="col-span-1">
                        (<Formatters.FormatteurTaille value={item.free} />)
                    </div>
                </React.Fragment>
            )
        })
    }, [value]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4'>File storage</h2>
            <div className='grid grid-cols-6'>
                <p className='font-bold pb-2 col-span-3'>Mount</p>
                <p className='font-bold pb-2'>Total</p>
                <p className='font-bold pb-2'>Used</p>
                <p className='font-bold pb-2'>Free</p>
                {mounts}
            </div>
        </section>
    );
}

function InstanceCertificate(props: {value: ServerInstance | null | undefined}) {

    let { value } = props;

    let [unavailable, setUnavailable] = useState(false);
    let [certificate, setCertificate] = useState(null as certificates.CertificateWrapper | null);
    let [expired, setExpired] = useState(false);
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    useEffect(()=>{
        if(!value || !ready) return;
        let hostname = value.hostname;
        if(!hostname) {
            setUnavailable(true);
            return;
        }
        setUnavailable(false);
    
        Promise.resolve().then(async () => {
            let urlInstance = new URL(`https://${hostname}/installation/api/info`);
            let instanceResponse = await axios({method: 'GET', url: urlInstance.href});
            let instanceInformation = instanceResponse.data as InstanceInformation;
            console.debug("Instance information\n", instanceInformation);
            if(instanceInformation.certificat) {
                let certificate = new certificates.CertificateWrapper(instanceInformation.certificat);
                certificate.populateExtensions();
                console.debug("Certificate ", certificate);
                setCertificate(certificate);
            } else {
                console.error("No certificate information");
                setExpired(true);
            }

        })
        .catch(err=>{
            console.error("Error loading instance information via HTTPS", err)
            setUnavailable(true);
        });
    }, [ready, value, setUnavailable, setCertificate, setExpired]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-6'>Certificate</h2>
            {unavailable?
                <p>Access via Https is unavailable.</p>
            :<></>}
            {expired?
                <p>Certificate is expired.</p>
            :<></>}
            {(!certificate && !unavailable && !expired)?
                <p>Loading ...</p>
            :<></>}
            <ShowCertificateInformation value={certificate} />
            <RenewCertificateButton certificate={certificate} instance={value} onChange={setCertificate} />
        </section>
    )
}

function ShowCertificateInformation(props: {value: certificates.CertificateWrapper | null}) {

    let {value} = props;

    let expired = useMemo(()=>{
        let notAfter = value?.certificate?.notAfter;
        if(!notAfter) return false;  // No information
        return notAfter < new Date();
    }, [value]);

    if(!value) return <></>;

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 pb-4'>
            <p>Instance Id</p>
            <p>{value.extensions?.commonName}</p>
            <p>Exchanges</p>
            <p>{value.extensions?.exchanges?.join(', ')}</p>
            <p>Roles</p>
            <p>{value.extensions?.roles}</p>
            <p>Valid not before</p>
            <p><Formatters.FormatterDate value={value.certificate.notBefore.getTime()/1000} /></p>
            <p>Valid not after</p>
            <p className={expired?'text-red-500':''}>
                <Formatters.FormatterDate value={value.certificate.notAfter.getTime()/1000} />
                {expired?<> (Expired)</>:<></>}
            </p>
        </div>
    )
}

type RenewCertificateButtonProps = {
    certificate: certificates.CertificateWrapper | null, 
    instance: ServerInstance | null | undefined, 
    onChange: Dispatch<certificates.CertificateWrapper | null>
};

function RenewCertificateButton(props: RenewCertificateButtonProps) {

    let { certificate: value, instance, onChange } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let featureAvailable = useMemo(()=>{
        if(!value) return false;
        if(value.extensions?.exchanges?.includes('3.protege')) return false;  // Security 3/4 renew their own certificate
        return true;
    }, [value]);

    let renewHandler = useCallback(async () => {
        if(!workers || !ready) throw new Error("workers not initialized");
        if(!instance || !instance.hostname) throw new Error("Hostname not provided");
        let hostname = instance.hostname;
        let exchanges = value?.extensions?.exchanges;
        if(!exchanges) throw new Error("Certificate has no exchanges, security unknown");
        let security = exchanges[0];  // First element is the highest security level for the certificate.

        let instanceUrl = new URL(`https://${hostname}`);
        let newCertificate = await generateSatelliteCertificate(workers, instanceUrl, security);

        // Load in wrapper to validate
        console.debug("New certificate ", newCertificate);
        let newCertificateWrapper = new certificates.CertificateWrapper(newCertificate);
        newCertificateWrapper.populateExtensions();

        // Install new certificate
        let command = { certificat: newCertificate };
        let installUrl = new URL(`https://${hostname}`);
        installUrl.pathname = '/installation/api/installerCertificat';
        let installResponse = await axios({method: 'POST', url: installUrl.href, data: command, timeout: 5_000});
        if(installResponse.data.ok !== true) {
            throw new Error("Error installing certifcate: " + installResponse.data.err);
        }

        // Show new certificate
        onChange(newCertificateWrapper);

    }, [workers, ready, value, instance, onChange]);

    if(!featureAvailable) return <></>;

    return <ActionButton onClick={renewHandler}>Renew</ActionButton>
}

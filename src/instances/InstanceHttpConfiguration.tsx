import axios from "axios";
import { certificates } from "millegrilles.cryptography";
import { Formatters } from "millegrilles.reactdeps.typescript";
import { Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import MasterKeyLoader, { MasterKeyInformation } from "../utilities/MasterKeyLoader";
import ActionButton from "../components/ActionButton";
import { installIntermediateCertificate } from "../installer/GenerateCertificates";
import useConnectionStore from "../connectionStore";

type HttpsProps = {
    url: URL,
    server: ServerConfiguration | null,
}

export type InstanceInformation = {
    ca?: string,
    certificat?: string[],
    idmg?: string,
    instance_id?: string,
    securite?: string,
}

export type ServerConfiguration = {
    info: InstanceInformation,
}

export function ShowSigningCertificateInformation(props: {value: certificates.CertificateWrapper | null}) {

    let {value} = props;

    let [expired, notAfterDateClassName, daysLeft] = useMemo(()=>{
        let notAfter = value?.certificate?.notAfter;
        if(!notAfter) return [false, '', null];  // No information

        let now = new Date();

        let expired = notAfter < now;
        if(expired) return [true, 'text-red-500', 0];
        
        // let dueSoon = notAfter.getTime() < (now.getTime() + 180*86_400_000);
        let daysLeft = Math.floor((notAfter.getTime() - now.getTime()) / 86_400_000);
        let dueSoon = daysLeft < 180;
        if(dueSoon) return [false, 'text-yellow-400', daysLeft];

        return [false, '', null];
    }, [value]);

    if(!value) return <></>;

    return (
        <section>
            <h2 className='text-lg font-bold pb-4'>Signing certificate</h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 pb-4'>
                <p>Instance Id</p>
                <p>{value.extensions?.commonName}</p>
                <p>Valid not before</p>
                <p><Formatters.FormatterDate value={value.certificate.notBefore.getTime()/1000} /></p>
                <p>Valid not after</p>
                <p className={notAfterDateClassName}>
                    <Formatters.FormatterDate value={value.certificate.notAfter.getTime()/1000} />
                    {expired?
                        <> (Expired)</>
                        :
                        <>{daysLeft?<> ({daysLeft} days left)</>:<></>}</>
                    }
                    
                </p>
            </div>
        </section>
    )
}

export function HttpsRenewSigningCertificate(props: HttpsProps) {

    let { url, server } = props;

    let recoveryMode = useConnectionStore(state=>state.recoveryMode);

    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null)

    let [signingCertificate, setSigningCertificate] = useState(null as certificates.CertificateWrapper | null);

    let featureAvailable = useMemo(()=>{
        let securite = server?.info.securite;
        let featureAvailable = false;
        if(['3.protege', '4.secure'].includes(securite || '')) featureAvailable = true;
        return featureAvailable;
    }, [server]);

    let renewHandler = useCallback(async () => {
        if(!masterKey) throw new Error('master key not loaded');
        let security = server?.info.securite;
        if(!security) throw new Error('security not provided');
        let certificate = await installIntermediateCertificate(masterKey, security);  // Throws error on failure
        setSigningCertificate(certificate);
    }, [server, masterKey]);

    useEffect(()=>{
        if(!url || !featureAvailable) return;

        // Load signing certificate
        let certificate = server?.info.certificat;
        if(certificate) {
            let signingCertificate = new certificates.CertificateWrapper([certificate[1]]);
            signingCertificate.populateExtensions();
            console.debug("Signing certificate ", signingCertificate);
            setSigningCertificate(signingCertificate);
        }
    }, [url, featureAvailable, server]);

    if(!recoveryMode && (!signingCertificate || !featureAvailable)) return <></>;  // Not applicable

    return (
        <>
            <ShowSigningCertificateInformation value={signingCertificate} />

            {recoveryMode?
                <p className='pb-1'>The server certificate is expired.</p>
            :<></>}

            <p className='pb-1'>To renew the signing certificate, load the system's Master Key and click on Renew.</p>

            <MasterKeyLoader onChange={setMasterKey} />
            <ActionButton onClick={renewHandler} mainButton={true} disabled={!masterKey}>Renew</ActionButton>
        </>
    );
}

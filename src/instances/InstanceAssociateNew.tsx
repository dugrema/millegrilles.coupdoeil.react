import { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import axios from "axios";
import { InstanceInformation, ServerConfiguration } from "./InstanceHttpConfiguration";
import useWorkers, { AppWorkers } from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { messageStruct } from "millegrilles.cryptography";
import { GenerateCertificateInstanceCommand } from "../workers/connection.worker";

function AssociateNew() {

    let [instanceUrl, setInstanceUrl] = useState(null as URL | null);
    let [serverConfiguration, setServerConfiguration] = useState(null as ServerConfiguration | null);
    let [urlMq, setUrlMq] = useState(`amqps://${window.location.hostname}:5673/`);
    let urlMqChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>setUrlMq(e.currentTarget.value), [setUrlMq]);

    useEffect(()=>{
        if(!instanceUrl) {
            setServerConfiguration(null);
            return;
        }
        let url = new URL(instanceUrl);
        Promise.resolve().then(async () => {
            url.pathname = '/installation/api/info';
            let configResponse = await axios({method: 'GET', url: url.href, timeout: 5_000});
            console.debug("Server configuration ", configResponse.data);
            setServerConfiguration({info: configResponse.data as InstanceInformation});
        })
        .catch(err=>console.error("Error loading server information", err));
    }, [instanceUrl, setServerConfiguration]);

    return (
        <>
            <Link to='/coupdoeil2/instances'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Associate instance</h1>

            <p className='pt-2'>
                A new instance certificate will be created and the bus configuration will be provided to an instance that is already
                locked to this System Id.
            </p>

            <p className='pt-2'>
                This feature can be used to configure a brand new instance or renew the certificate and fix the bus configuration
                of an already configured instance.
            </p>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>MilleGrilles bus connection (RabbitMQ)</h2>
                <div className='grid grid-cols-1 md:grid-cols-2'>
                    <input type="url" value={urlMq} onChange={urlMqChangeHandler} className='text-black' />
                </div>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Enter instance URL</h2>
                <InstanceConnectHttp setUrl={setInstanceUrl} />
            </section>

            <ShowServerConfiguration value={serverConfiguration} urlMq={urlMq} instanceUrl={instanceUrl} />
        </>
    );
}

export default AssociateNew;

function InstanceConnectHttp(props: {setUrl: Dispatch<URL|null>}) {

    let { setUrl } = props;

    let [urlInput, setUrlInput] = useState('');
    let [err, setErr] = useState(null as any);
    let urlInputOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
        setUrlInput(e.currentTarget.value);
        setUrl(null);
    }, [setUrlInput, setUrl]);
    let [openSeparate, setOpenSeparate] = useState('');

    let connectHandler = useCallback(async () => {
        console.debug("Connect to ", urlInput);
        let url = null as URL | null;

        // Reset error
        setErr(null);
        setOpenSeparate('');
        
        try { url = new URL(urlInput); } 
        catch (err) { setErr(err); throw err; }
        
        url.pathname = '/installation/api/info'
        try {
            let response = await axios({method: 'GET', url: url.href, timeout: 5_000});
            console.debug("Server response, ", response.data);
            setUrl(url);
        } catch(err: any) { 
            setErr(err); 
            throw err; 
        }
    }, [urlInput, setErr, setOpenSeparate, setUrl]);

    useEffect(()=>{
        if(!err) {
            // Cleanup
            setOpenSeparate('');
            return;
        }
        let { response, code, message, isAxiosError } = err;
        if(isAxiosError && code === axios.AxiosError.ERR_NETWORK) {
            setOpenSeparate(urlInput);
            return;
        }
        console.warn("ERROR", err);
        console.warn("Error.response %O, code %O, message %O", response, code, message);

    }, [err, setOpenSeparate, urlInput]);

    return (
        <>
            <div className='grid grid-cols-1 sm:grid-cols-4 pb-6'>
                <input type="url" value={urlInput} onChange={urlInputOnChange} 
                    placeholder="Ex.: https://server.com"
                    className='col-span-3 text-black' />
                <ActionButton onClick={connectHandler} mainButton={true}>Connect</ActionButton>
            </div>

            <div>
                <OpenSeparateWindow url={openSeparate} />
            </div>
        </>
    )
}

function OpenSeparateWindow(props: {url: string | null}) {

    let { url } = props;

    if(!url) return <></>;

    return (
        <>
            <h2 className='text-lg font-bold pt-4 pb-2'>Error connecting to server</h2>

            <p className='pb-2'>
                There was a network error connecting to the site. If the address is correct, 
                it is likely due to a self-signed HTTPS certificate.
            </p>

            <p className='pb-4'>
                You can try to open the page directly from the browser and allowing the security exception. Then try the connect button again.
            </p>

            <p className='font-bold'>Open <a href={url} target='_blank' rel='noreferrer' className='underline'>{url}</a></p>
        </>
    )
}

function ShowServerConfiguration(props: {value: ServerConfiguration | null, urlMq: string, instanceUrl: URL | null}) {

    let { value, urlMq, instanceUrl } = props;

    let idmg = useConnectionStore(state=>state.idmg);

    let idmgClassName = useMemo(()=>{
        if(value?.info.idmg === idmg) return '';
        return 'text-red-500';
    }, [value, idmg]);

    let securityClassName = useMemo(()=>{
        if(value?.info.securite !== '3.protege') return '';
        return 'text-red-500';
    }, [value]);

    if(!value) return <></>;

    return (
        <section>
            <h2 className='text-lg font-bold pt-4 pb-2'>Server configuration</h2>

            <div className='grid grid-cols-3 pb-4'>
                <p>Idmg</p>
                <p className={'col-span-2 ' + idmgClassName}>{value.info.idmg}</p>
                <p>Security</p>
                <p className={'col-span-2 ' + securityClassName}>{value.info.securite}</p>
                <p>Instance id</p>
                <p className='col-span-2'>{value.info.instance_id}</p>
            </div>

            <p>
                Click on the following button to associate the instance. 
                If successfull, it will be restarted and try to connect to the bus.
            </p>

            <AssociateInstanceButton value={value} urlMq={urlMq} instanceUrl={instanceUrl} />

        </section>
    )
}

function AssociateInstanceButton(props: {value: ServerConfiguration | null, urlMq: string, instanceUrl: URL | null}) {

    let { value, urlMq, instanceUrl } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let idmg = useConnectionStore(state=>state.idmg);
    let caPem = useConnectionStore(state=>state.ca);

    let associateHandler = useCallback(async () => {
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceUrl) throw new Error("No instance URL");

        let security = value?.info.securite;
        if(!security) throw new Error('Unknown security level');
        let mqURL = new URL(urlMq.replace('amqps:', 'https:'));
        console.debug("MQ Url string : %O, %O", urlMq, mqURL);

        if(security === '4.secure') {
            await installSecure(workers, instanceUrl, mqURL);
        } else if (['1.public', '2.prive'].includes(security)) {
            // Sign CSR, send installation command.
            await installSatellite(workers, instanceUrl, mqURL, security, caPem);
        } else {
            throw new Error(`Security level ${security} is not supported`);
        }
    }, [workers, ready, value, urlMq, instanceUrl, caPem]);

    if(!value) return <></>;

    if(value.info.idmg !== idmg) {
        return (
            <>
                <p className='text-red-500 font-bold pt-4'>Error</p>
                <p className='text-red-500'>The instance cannot be managed by this system (wrong IDMG).</p>
                <p>This System's Id is <span className='font-bold'>{idmg}</span>.</p>
            </>
        )
    }

    if(value.info.securite === '3.protege') {
        return (
            <>
                <p className='text-red-500 font-bold pt-4'>Error</p>
                <p className='text-red-500'>A 3.protege instance cannot be associated to a system.</p>
                <p>This instance is the core of the system with the MilleGrilles bus. Other instances can be associated to it.</p>
            </>
        )
    }

    return <ActionButton onClick={associateHandler} disabled={!ready}>Associate</ActionButton>
}

async function installSecure(workers: AppWorkers, instanceUrl: URL, mqUrl: URL) {
    let params = {
        host: mqUrl.hostname,
        port: mqUrl.port,
    };

    // Just need to configure MQ
    let command = await workers.connection.createRoutedMessage(
        messageStruct.MessageKind.Command, params, {action: 'changerConfigurationMq'});
    console.debug("Signed MQ command", command);

    let mqConfigUrl = new URL(instanceUrl.href);
    mqConfigUrl.pathname = '/installation/api/configurerMQ';

    let response = await axios({method: 'POST', url: mqConfigUrl.href, data: command, timeout: 5_000});
    if(response.data.ok !== true) {
        console.warn("Response ", response);
        throw new Error(`Association failed: ${response.data.err}`);
    }
}

export async function generateSatelliteCertificate(workers: AppWorkers, instanceUrl: URL, security: string) {
    // Get the CSR
    const urlCsr = new URL(instanceUrl.href)
    urlCsr.pathname = '/installation/api/csrInstance';
    let responseCsr = await axios({method: 'GET', url: urlCsr.href, timeout: 5_000});
    let csrValue = responseCsr.data;
    if(typeof(csrValue) !== 'string') throw new Error("Wrong CSR response type, must be text");
    
    // Prepare values
    let role = 'public';
    let exchanges = ['1.public'];
    if(security === '2.prive') {
        role = 'prive'
        exchanges.push('2.prive')
    }
    exchanges = exchanges.reverse();
    
    const hostnames = [instanceUrl.hostname]

    // Generate the certificate
    let certificateCommand = {
        csr: csrValue, securite: security, 
        role, roles: ['instance'], exchanges, 
        dns: {localhost: true, hostnames}
    } as GenerateCertificateInstanceCommand;
    console.debug("Certificate command", certificateCommand);
    let certificateResponse = await workers.connection.generateSatelliteInstanceCertificate(certificateCommand);
    console.debug("Response ", certificateResponse);
    if(certificateResponse.ok !== true || !certificateResponse.certificat) {
        throw new Error('Error signing instance certificate: ' + certificateResponse.err);
    }
    let certificate = certificateResponse.certificat;
    return certificate;
}

async function installSatellite(workers: AppWorkers, instanceUrl: URL, mqUrl: URL, security: string, caCertificate: string) {

    let certificate = await generateSatelliteCertificate(workers, instanceUrl, security);

    let installationParams = {
        hostname: instanceUrl.hostname,
        certificat: certificate,
        certificatMillegrille: caCertificate,
        securite: security,
        host: mqUrl.hostname,
        port: mqUrl.port,
    }

    console.debug("Installation params: ", installationParams);

    const urlInstaller = new URL(instanceUrl.href)
    urlInstaller.pathname = '/installation/api/installer';
    let responseInstallation = await axios({method: 'POST', url: urlInstaller.href, data: installationParams, timeout: 5_000});
    if(responseInstallation.data.ok !== true) {
        throw new Error("Error associating new instance: " + responseInstallation.data.err);
    }
}


//   function AfficherExpirationCertificat(props) {
//     const [certificat, setCertificat] = useState('')
//     useEffect(_=>{
//       const pem = props.pem
//       var cert = ''
//       if(pem) {
//         try {
//           console.debug("PEM : %O", pem)
//           cert = forgePki.certificateFromPem(pem)
//           console.debug("Cert : %O", cert)
//         } catch(err) {
//           console.error("Erreur chargement certificat noeud: %O", err)
//         }
//       }
//       setCertificat(cert)
//     }, [props.pem])
  
//     const validity = certificat.validity || ''
  
//     var notAfter = '', expirationDuree = ''
//     if(validity) {
//       notAfter = '' + validity.notAfter
//       const expirationDureeMs = validity.notAfter.getTime() - new Date().getTime()
//       if(expirationDureeMs < 0) {
//         expirationDuree = 'Expire'
//       } else {
//         const jourMs = 1000*60*60*24
//         if(expirationDureeMs > jourMs) {
//           const expirationDureeJours = expirationDureeMs / jourMs
//           expirationDuree = Math.floor(expirationDureeJours) + ' jours'
//         } else {
//           const expirationDureeHeures = expirationDureeMs / (1000*60*60)
//           expirationDuree = Math.floor(expirationDureeHeures) + ' heures'
//         }
//       }
//       console.debug("Expiration duree : %O", expirationDuree)
//     } else {
//       return ''
//     }
  
//     return (
//       <>
//         <Row>
//           <Col md={3}>Expiration</Col>
//           <Col>{notAfter}</Col>
//         </Row>
//         <Row>
//           <Col md={3}>Duree restante</Col>
//           <Col>{expirationDuree}</Col>
//         </Row>
//       </>
//     )
//   }

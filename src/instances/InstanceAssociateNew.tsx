import { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import axios from "axios";
import { InstanceInformation, ServerConfiguration } from "./InstanceHttpConfiguration";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { messageStruct } from "millegrilles.cryptography";
import { MessageResponse } from "millegrilles.reactdeps.typescript";

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

            <h1 className='text-xl font-bold pt-4'>Associate new instance</h1>

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
        let { request, response, code, message, isAxiosError } = err;
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

            <p className='font-bold'>Open <a href={url} target='_blank' className='underline'>{url}</a></p>
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
    }, [value, idmg]);

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

    let associateHandler = useCallback(async () => {
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceUrl) throw new Error("No instance URL");

        let security = value?.info.securite;
        if(!security) throw new Error('Unknown security level');
        let mqURL = new URL(urlMq.replace('amqps:', 'https:'));
        console.debug("MQ Url string : %O, %O", urlMq, mqURL);

        let params = {
            host: mqURL.hostname,
            port: mqURL.port,
        };

        if(security === '4.secure') {
            // Just need to configure MQ
            let command = await workers.connection.createRoutedMessage(
                messageStruct.MessageKind.Command, params, {action: 'changerConfigurationMq'});
            console.debug("Signed MQ command", command);

            let mqConfigUrl = new URL(instanceUrl.href);
            mqConfigUrl.pathname = '/installation/api/configurerMQ';

            let response = await axios({method: 'POST', url: mqConfigUrl.href, data: command});
            if(response.data.ok !== true) {
                console.warn("Response ", response);
                throw new Error(`Association failed: ${response.data.err}`);
            }
        } else if (['1.public', '2.prive'].includes(security)) {
            // Sign CSR, send installation command.
            throw new Error('todo');
        } else {
            throw new Error(`Security level ${security} is not supported`);
        }
    }, [workers, ready, value, urlMq, instanceUrl]);

    if(!value) return <></>;

    if(value.info.idmg !== idmg) {
        return (
            <>
                <p className='text-red-500 font-bold'>Error</p>
                <p className='text-red-500'>The instance cannot be managed by this system (wrong IDMG).</p>
                <p>This system is <span className='font-bold'>{idmg}</span>.</p>
            </>
        )
    }

    if(value.info.securite === '3.protege') {
        return (
            <>
                <p className='text-red-500 font-bold'>Error</p>
                <p className='text-red-500'>A 3.protege instance cannot be associated to a system.</p>
                <p>This instance is the core of the system with the MilleGrilles bus. Other instances can be associated to it.</p>
            </>
        )
    }

    return <ActionButton onClick={associateHandler} disabled={!ready}>Associate</ActionButton>
}

// async function prendrePossession(workers, usager, csr, securite, hostname, hostMq, portMq, confirmationCb, erreurCb) {
  
//     try {
//         // console.debug("Demander la creation d'un nouveau certificat %s pour %s (MQ %s:%s)", securite, hostname, hostMq, portMq)
    
//         const connexion = workers.connexion
//         const urlInstaller = new URL('https://localhost/installation/api/installer')
//         urlInstaller.hostname = hostname

//         let role = 'public'
//         let exchanges = ['1.public']
//         if(securite === '1.public') role = 'public'
//         else if(securite === '2.prive') {
//             role = 'prive'
//             exchanges.push('2.prive')
//         }
//         else if(securite === '3.protege') {
//             exchanges.push('2.prive')
//             exchanges.push('3.protege')
//             role = 'protege'
//         }
//         exchanges = exchanges.reverse()
        
//         const hostnames = [hostname]
//         const hostnameNoDomain = hostname.split('.').shift()
//         if(hostnameNoDomain != hostname) {
//             hostnames.push(hostnameNoDomain)
//         }

//         const commande = {csr, securite, role, roles: ['instance'], exchanges, dns: {localhost: true, hostnames}}
    
//         try {
//             var resultatCertificat = await connexion.genererCertificatNoeud(commande)
//         } catch(err) {
//             console.error("Erreur creation certificat ", err);
//             erreurCb(err, 'Erreur creation certificat')
//             return
//         }
    
//         //console.debug("prendrePossession Reception info certificat : %O", resultatCertificat)
//         if(!resultatCertificat.certificat) {
//             erreurCb(null, "Erreur creation certificat pour prise de possession - non genere")
//             return
//         }

//         const paramsInstallation = {
//             hostname,
//             certificat: resultatCertificat.certificat,
//             certificatMillegrille: usager.ca,
//             securite,
//             host: hostMq,
//             port: portMq,
//         }
    
//         //console.debug("Transmettre parametres installation noeud : %O", paramsInstallation)
    
//         try {
//             const reponse = await axios({
//                 url: urlInstaller.href,
//                 method: 'post',
//                 data: paramsInstallation,
//                 timeout: 15000,
//             })
//             //console.debug("Recu reponse demarrage installation noeud\n%O", reponse)
//             const data = reponse.data || {}
//             if(data.err) {
//                 erreurCb(data.err)
//             } else {
//                 confirmationCb(`Prise de possession de ${hostname} reussie.`)
//             }
//         } catch(err) {
//             erreurCb(err, `Erreur prise de possession de l'instance`)
//             return
//         }
    
//     } catch(err) {
//         erreurCb(err)
//     }
// }



// async function configurerMq(workers, hostname, hostMq, portMq, confirmationCb, erreurCb) {
//     const {connexion} = workers
  
//     var commande = {}
//     if(!hostMq && !portMq) {
//       commande.supprimer_params_mq = true
//     } else {
//       commande.host = hostMq
//       commande.port = portMq
//     }
  
//     const domaine = 'monitor', action = 'changerConfigurationMq'
//     // const commandeSignee = await connexion.formatterMessage(commande, domaine, {kind: MESSAGE_KINDS.KIND_COMMANDE, action})
//     const commandeSignee = await connexion.formatterMessage(KIND_COMMANDE, commande, {domaine, action, ajouterCertificat: true})
  
//     console.debug("Commande a transmettre : %O", commandeSignee)
//     const url = new URL('https://localhost/installation/api/configurerMQ')
//     url.hostname = hostname
//     try {
//       const reponse = await axios({
//         method: 'post',
//         url,
//         data: commandeSignee,
//         timeout: 20000,
//       })
//       console.debug("Reponse configuration MQ : %O", reponse)
//       const data = reponse.data
//       if(data.ok === false) {
//         erreurCb(data.err, 'Erreur changement configuration MQ')
//       } else {
//         confirmationCb('Configuration MQ modifiee avec succes')
//       }
//     } catch(err) {
//       erreurCb(err, 'Erreur changement configuration MQ')
//     }
//   }
  
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
  
// type HttpsProps = {
//     url: URL,
//     server: ServerConfiguration | null,
// }

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

// export function EnterHttpsAddress() {
//     return <p>Https url</p>;
// }

// export function HttpsRenewCertificate(props: HttpsProps) {

//     let { url, server } = props;
//     let [csr, setCsr] = useState('');

//     // /installation/api/csrInstance

//     let [securite, featureAvailable] = useMemo(()=>{
//         let securite = server?.info.securite;
//         let featureAvailable = false;
//         if(['1.public', '2.private'].includes(securite || '')) featureAvailable = true;
//         return [securite, featureAvailable];
//     }, [server]);

//     useEffect(()=>{
//         if(!url || !featureAvailable) return;
//         Promise.resolve().then(async()=>{
//             let urlCsr = new URL(url.href);
//             urlCsr.pathname = '/installation/api/csr';
//             let response = await axios({method: 'GET', url: urlCsr.href});
//             console.debug("CSR response\n%s", response.data);
//             setCsr(response.data);
//         })
//         .catch(err=>console.error("Error loading CSR", err));
        
//     }, [url, setCsr, featureAvailable]);

//     if(!csr || !featureAvailable) return <></>;  // Not applicable

//     return <p>Renew certificate</p>;
// }

// export function HttpsRenewSigningCertificate(props: HttpsProps) {

//     let { url, server } = props;

//     let [csr, setCsr] = useState('');

//     let [securite, featureAvailable] = useMemo(()=>{
//         let securite = server?.info.securite;
//         let featureAvailable = false;
//         if(['3.protege', '4.secure'].includes(securite || '')) featureAvailable = true;
//         return [securite, featureAvailable];
//     }, [server]);

//     useEffect(()=>{
//         if(!url || !featureAvailable) return;
//         Promise.resolve().then(async()=>{
//             let urlCsr = new URL(url.href);
//             urlCsr.pathname = '/installation/api/csr';
//             let response = await axios({method: 'GET', url: urlCsr.href});
//             console.debug("CSR response\n%s", response.data);
//             setCsr(response.data);
//         })
//         .catch(err=>console.error("Error loading CSR", err));
        
//     }, [url, setCsr, featureAvailable]);

//     if(!csr || !featureAvailable) return <></>;  // Not applicable

//     return (
//         <>
//             <h2 className='text-lg font-bold pt-4 pb-2'>Renew signing certificate</h2>
//             <p>Todo: Load master key</p>
//         </>
//     );
// }

// export function HttpsConfigureMqConnection(props: HttpsProps) {
//     return <p>Configure MQ Bus connection</p>;
// }

// export function HttpsAssociateNewInstance(props: HttpsProps) {
//     return <p>Associate new instance</p>;
// }

// export function MqConnectionParameters(props: {setUrl: Dispatch<Url|null>}) {
    
//     let { setUrl } = props;

//     let [urlString, setUrlString] = useState('');
//     let urlStringChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
//         setUrl(null);
//         setUrlString(e.currentTarget.value);
//     }, [setUrlString, setUrl]);

//     return (
//         <>
//             <input type="url" value={urlString} onChange={urlStringChangeHandler} />
//             <button></button>
//         </>
//     );
// }

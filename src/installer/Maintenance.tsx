import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import useConnectionStore from "../connectionStore";

import { InstanceInformation, ServerConfiguration } from "../instances/InstanceHttpConfiguration";

function Maintenance() {
    let installationMode = useConnectionStore(state=>state.installationMode);

    let [serverConfiguration, setServerConfiguration] = useState(null as ServerConfiguration | null);

    let url = useMemo(()=>{
        let url = new URL(window.location.href);
        url.pathname = '';  // Remove pathname, we just need the hostname and port
        return url;
    }, []);

    useEffect(()=>{
        if(!url) return;

        Promise.resolve().then(async () => {
            let urlInfo = new URL(url.href);
            urlInfo.pathname = '/installation/api/info';
            let response = await axios({method: 'GET', url: urlInfo.href}); 
            let serverInfo = {info: response.data as InstanceInformation};
            console.debug("ServerInfo ", serverInfo);
            setServerConfiguration(serverInfo)
        })
        .catch(err=>console.error("Error connecting to server", err));
    }, [setServerConfiguration, url]);

    if(installationMode) return <></>;

    return (
        <>
            <section>
                <h2 className='text-lg font-bold pb-4'>Maintenance mode</h2>

                <p className='pb-2'>The initial setup is complete.</p>

                <p className='pb-2'>
                    You can use this page to fix some of the configuration of instance {url.hostname} when
                    the MilleGrilles bus is not working.
                </p>
            </section>

            <ShowServerConfiguration value={serverConfiguration} />
        </>
    )
}

export default Maintenance;

function ShowServerConfiguration(props: {value: ServerConfiguration | null}) {
    return (
        <section>
        </section>
    )
}
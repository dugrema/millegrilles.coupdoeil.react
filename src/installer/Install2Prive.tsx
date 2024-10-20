import { ChangeEvent, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import axios from "axios";


function Install2Prive() {
    return <InstallSatellite security='2.prive' />
}

export default Install2Prive;

export function InstallSatellite(props: {security: string}) {

    let { security } = props;

    return (
        <>
            <Link to='/coupdoeil2/install'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Install a {security} instance</h1>

            <InstallSatelliteInstance security={security} />
        </>
    )
}

function InstallSatelliteInstance(props: {security: string}) {
    let { security } = props;

    let [idmgString, setIdmgString] = useState('');
    let idmgStringChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>setIdmgString(e.currentTarget.value), [setIdmgString]);
    let [done, setDone] = useState(false);

    let runSetupHandler = useCallback( async () => {

        let url = new URL(window.location.href);
        url.pathname = '/installation/api/configurerIdmg'

        let params = {idmg: idmgString, securite: security};
        let response = await axios({method: 'POST', url: url.href, data: params});
        console.debug("Response: ", response);
        if(response.data.ok === true) {
            setDone(true)
        } else {
            console.error("Error setting parameters", response.data);
            throw new Error(''+response.data.err);
        }
    }, [security, idmgString, setDone]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-2'>Setup instance</h2>
            <p className='pb-2'>The instance security level is: {security}</p>

            <p>This step locks in your new instance to your system ID and prepares it to be associated to your bus.</p>

            <div className='grid grid-cols-1 md:grid-cols-3 pt-4 pb-2'>
                <label htmlFor='idmgInput'>Enter your system ID (IDMG)</label>
                <input id='idmgInput' type='text' value={idmgString} onChange={idmgStringChangeHandler} 
                    className='text-black col-span-2' placeholder='Your IDMG, for example: zT8sJcgKm92LX8FJNr3uBLZcM9WG2hbA4fALyjRb6GsFRpeRN5u8chKE' />
            </div>

            <ActionButton onClick={runSetupHandler} mainButton={true} disabled={!idmgString}>
                Start
            </ActionButton>

            <SetupInformation show={done} />
        </section>
    )
}

function SetupInformation(props: {show: boolean}) {

    let { show } = props;

    if(!show) return <></>;

    return (
        <>
            <p>Instance lock successful.</p>

            <h2 className='text-lg font-bold pt-4 pb-2'>Associating to the MilleGrilles bus</h2>

            <p>
                This initial setup of the instance is done. Now you have to associate it with the MilleGrilles bus. 
                This will produce the initial X.509 security certificate and provide the RabbitMQ connection URL.
            </p>

            <p className='pt-2'>Go in Coup D'Oeil on your 3.protege instance, go to Instances then click on Associate. Follow the steps there.</p>
        </>
    )
}

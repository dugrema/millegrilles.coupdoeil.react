import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { forgePrivateKey } from "millegrilles.cryptography";

import { MasterKeyInformation } from "../utilities/MasterKeyLoader";

type InstallInstanceProps = {
    masterKey: MasterKeyInformation,
    security: string,
}

function InstallInstance(props: InstallInstanceProps) {
    let { masterKey, security } = props;

    let navigate = useNavigate();

    let [running, setRunning] = useState(false);
    let runSetupHandler = useCallback(()=>{
        runSetup(masterKey, security)
            .then(()=>{
                console.debug("Initial setup done.")
                navigate('/coupdoeil2/install/status');
            })
            .catch(err=>console.error("Error during initial setup: ", err))
            .finally(()=>{
                setRunning(false);
            });
    }, [masterKey, security, setRunning, navigate]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-2'>Setup instance</h2>
            <p className='pt-4 pb-2'>The system Id for the key is: {masterKey.file.idmg}</p>
            <p className='pb-2'>The instance security level is: {security}</p>

            <button onClick={runSetupHandler} disabled={running}
                className="btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900">
                    Start
            </button>
        </section>
    )
}

export default InstallInstance;

async function runSetup(masterKey: MasterKeyInformation, security: string) {
    if(!['3.protege', '4.secure'].includes(security)) throw new Error("Only 3.protege and 4.secure security levels are supported");
    await installIntermediateCertificate(masterKey, security);
}

export async function installIntermediateCertificate(masterKey: MasterKeyInformation, security: string) {
    // Get the CSR
    let response = await axios({method: 'GET', url: '/installation/api/csr'});
    let csrValue = response.data;
    if(typeof(csrValue) !== 'string') throw new Error("Wrong CSR response type, must be text");
    
    // Generate new signing certificate
    let intermediateCertificate = await forgePrivateKey.generateIntermediateCertificate(
        csrValue, masterKey.file.racine.certificat, masterKey.key);

    // Send setup instructions
    let params = {
        idmg: masterKey.file.idmg,
        certificatMillegrille: masterKey.file.racine.certificat,
        certificatIntermediaire: intermediateCertificate,
        securite: security,
    };

    console.debug("Installation parameters: ", params);
    await axios.post('/installation/api/installer', params);  // Throws error on failure
}

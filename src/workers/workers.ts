import {certificates} from "millegrilles.cryptography";
import { Remote, wrap } from 'comlink';

import { ConnectionCallbackParameters } from 'millegrilles.reactdeps.typescript';

import { AppsConnectionWorker } from "./connection.worker";
import { AppsEncryptionWorker } from './encryption.worker';

export type AppWorkers = {
    connection: Remote<AppsConnectionWorker>,
    encryption: Remote<AppsEncryptionWorker>,
};

const SOCKETIO_PATH = '/millegrilles/socket.io';

let workers: AppWorkers | null = null;

function useWorkers() {
    return workers;
}

export default useWorkers;

export type InitWorkersResult = {
    idmg: string,
    ca: string,
    chiffrage: Array<Array<string>>,
    workers: AppWorkers,
}

export async function initWorkers(callback: (params: ConnectionCallbackParameters) => void): Promise<InitWorkersResult> {

    const {idmg, ca, chiffrage} = await loadFiche();

    const connectionWorker = new Worker(new URL('./connection.worker.ts', import.meta.url), {type: 'module'});
    const connection = wrap(connectionWorker) as Remote<AppsConnectionWorker>;

    const encryptionWorker = new Worker(new URL('./encryption.worker.ts', import.meta.url), {type: 'module'});
    const encryption = wrap(encryptionWorker) as Remote<AppsEncryptionWorker>;

    // Set-up the workers
    const serverUrl = new URL(window.location.href);
    serverUrl.pathname = SOCKETIO_PATH;
    await connection.initialize(serverUrl.href, ca, callback, {reconnectionDelay: 7500});
    await encryption.initialize(ca);
    await encryption.setEncryptionKeys(chiffrage);

    workers = {connection, encryption};

    return {idmg, ca, chiffrage, workers};
}

type LoadFicheResult = {
    ca: string,
    idmg: string,
    chiffrage: Array<Array<string>>,
}

async function loadFiche(): Promise<LoadFicheResult> {
    const ficheResponse = await fetch('/fiche.json');
    if(ficheResponse.status !== 200) {
        throw new Error(`Loading fiche.json, invalid response (${ficheResponse.status})`)
    }
    const fiche = await ficheResponse.json();

    const content = JSON.parse(fiche['contenu']);
    const {idmg, ca, chiffrage} = content;

    // Verify IDMG with CA
    const idmgVerif = await certificates.getIdmg(ca);
    if(idmgVerif !== idmg) throw new Error("Mismatch IDMG/CA certificate");
    
    console.info("IDMG: ", idmg);

    // Verify the signature.
    const store = new certificates.CertificateStore(ca);
    if(! await store.verifyMessage(fiche)) throw new Error('While loading fiche.json: signature was rejected.');  // Throws Error if invalid

    // Return the content
    return {idmg, ca, chiffrage};
}
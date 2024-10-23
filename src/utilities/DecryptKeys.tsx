import { Link } from 'react-router-dom';
import useWorkers, { AppWorkers } from '../workers/workers';
import { keymaster } from 'millegrilles.cryptography';
import { useCallback, useMemo, useState } from 'react';
import useConnectionStore from '../connectionStore';
import MasterKeyLoader, { MasterKeyInformation } from './MasterKeyLoader';
import ActionButton from '../components/ActionButton';

function DecryptKeys(props: {onChange?: ()=>void}) {

    let { onChange } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null);
    let [keyProgress, setKeyProgress] = useState(null as KeyProgress | null);

    let decryptKeysHandler = useCallback(async () => {
        if(!ready || !workers) throw new Error("workers not initialized");
        if(!masterKey) throw new Error("Master key not loaded");
        await decryptNonDecryptableKeys(workers, masterKey.key, setKeyProgress);
        if(onChange) onChange();
    }, [ready, workers, masterKey, setKeyProgress, onChange]);

    return (
        <>
            <MasterKeyLoader onChange={setMasterKey} />

            <ActionButton onClick={decryptKeysHandler} disabled={!ready || !masterKey} mainButton={true}>
                Start
            </ActionButton>

            <MaitreDesClesProgress value={keyProgress} />
        </>
    );
}

export default DecryptKeys;

export type KeyProgress = {
    total: number,
    current: number,
    done: boolean,
}

export async function decryptNonDecryptableKeys(workers: AppWorkers, masterKey: Uint8Array, progressCallback: (e: KeyProgress)=>void) {
    let countResponse = await workers.connection.getNonDecryptableKeyCount();

    // @ts-ignore
    const keyCount = countResponse.compte || 0;

    let keyCounter = 0;
    let serverIdx = 0;
    let batchCount = 0;
    progressCallback({total: keyCount, current: keyCounter, done: false});
    while(keyCounter < keyCount) {
        let response = await workers.connection.getNonDecryptableKeyBatch(serverIdx, 100);
        let keys = response.cles;
        if(!keys) throw new Error("out of sync, no keys received");
        if(!response.idx) throw new Error("out of sync, no server idx counter received");

        if(keys.length === 0) {
            // Out of sync but done
            break;
        }

        keyCounter += keys.length;
        serverIdx = response.idx;

        // Keep all information indexed by keyId for later reconciliation
        let keyDict = {} as {[key: string]: any};

        // Structure keys as string: DomaineSignature
        let keySignatureDict = {} as {[key: string]: keymaster.DomainSignature};
        for(let key of keys) {
            let keyId = key.cle_id;
            keySignatureDict[keyId] = key.signature;
            keyDict[keyId] = key;
        }

        // Decrypt keys
        let decryptedKeys = await workers.encryption.decryptCaKeysToBase64Nopad(masterKey, keySignatureDict);

        // Insert all key information with each decrypted key
        for await (let keyId of Object.keys(decryptedKeys)) {
            let decryptedKey = decryptedKeys[keyId];
            let keyInfo = keyDict[keyId];
            keyInfo.cle_secrete = decryptedKey;
        }

        // Encrypted command content
        let commandToEncrypt = {cles: keyDict};
        let reEncryptedKeys = await workers.encryption.encryptMessageMgs4ToBase64(commandToEncrypt, ['MaitreDesCles']);

        let nowait = batchCount % 10 !== 0;  // Sync every n batch. Avoids overloading the Q.
        await workers.connection.sendEncryptedKeyBatch(reEncryptedKeys, nowait);
        batchCount++;

        progressCallback({total: keyCount, current: keyCounter, done: false});
    };

    progressCallback({total: keyCount, current: keyCounter, done: true});
}

export function MaitreDesClesProgress(props: {value: KeyProgress | null}) {
    let { value } = props;

    let currentPct = useMemo(()=>{
        if(!value) return null;
        let { current, total, done } = value;
        if(done) return 100;
        return Math.floor(current / total * 100.0);
    }, [value]);

    if(!value) return <></>;

    return (
        <p>Maitre des cles progress: {currentPct}%</p>
    )
}

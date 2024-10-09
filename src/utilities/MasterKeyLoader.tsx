import { ChangeEvent, useCallback, useEffect, useState } from "react";
import UploadButton from "../components/UploadButton";
import { forgePrivateKey } from 'millegrilles.cryptography';

type MasterKeyProps = {
    // children?: React.ReactElement,
    onChange: (key: MasterKeyInformation | null) => void,
    disabled?: boolean,
}

export type MasterKeyInformation = {
    key: Uint8Array,
    file: MasterKeyFile,
}

function MasterKeyLoader(props: MasterKeyProps) {

    let { onChange, disabled } = props;

    let [loaded, setLoaded] = useState(false);

    let onChangeCallback = useCallback((key: MasterKeyInformation | null)=>{
        setLoaded(!!key);
        onChange(key);
    }, [onChange, setLoaded]);

    if(loaded) {
        return <KeyLoaded onChange={onChangeCallback} />;
    }

    return (
        <div className="grid grid-cols-2">
            <LoadKey onChange={onChangeCallback} disabled={disabled} />
        </div>
    );
}

export default MasterKeyLoader;

type LoadKeyProps = {
    onChange: (key: MasterKeyInformation | null) => void,
    disabled?: boolean,
}

function LoadKey(props: LoadKeyProps) {

    let { onChange, disabled } = props;

    let [password, setPassword] = useState('');
    let passwordOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setPassword(e.currentTarget.value), [setPassword]);
    let [encryptedKey, setEncryptedKey] = useState(null as MasterKeyFile | null);
    let [invalid, setInvalid] = useState(false);

    let uploadHandler = useCallback((files: FileList | null)=>{
        if(files) {
            parseFile(files)
                .then(setEncryptedKey)
                .catch(err=>console.error("Error loading encrypted key file", err));
        } else {
            setEncryptedKey(null);
        }
    }, [setEncryptedKey]);

    useEffect(()=>{
        if(password && encryptedKey) {
            try {
                let decryptedKey = forgePrivateKey.loadEd25519PrivateKey(encryptedKey.racine.cleChiffree, {password, pemout: true});
                setInvalid(false);
                setPassword('');
                setEncryptedKey(null);
                let decryptedKeyBytes = decryptedKey.privateKeyBytes;
                onChange({file: encryptedKey, key: decryptedKeyBytes});
            } catch(err) {
                console.error("Error decrypting key: ", err);
                setInvalid(true);
            }
        }
    }, [password, encryptedKey, setInvalid, onChange, setEncryptedKey, setPassword]);

    return (
        <>
            <input type="text" value={password} onChange={passwordOnChange} placeholder="Master key password, ex: p7Pxu+wrscBTlavrodLZRUAPbqHQge9+KAGuJedhOwU"
                className="text-black" />
            <div>
                <UploadButton id="masterKeyUploadId" onChange={uploadHandler} disabled={disabled}
                    className="btn pl-7 inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500">
                        <p>Upload</p>
                </UploadButton>
            </div>
            <div className="min-h-7">
                {invalid?
                    <p className='text-red-600'>The key file and password do not match.</p>
                :<></>}
            </div>
        </>
    )
}

function KeyLoaded(props: LoadKeyProps) {

    let { onChange } = props;

    let forgetKeyHandler = useCallback(()=>onChange(null), [onChange]);

    return (
        <div className='pb-4'>
            <p className='text-green-400 font-bold'>The master key is ready.</p>
            <button onClick={forgetKeyHandler}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500'>
                    Forget key
            </button>
        </div>
    )
}

export type MasterKey = {
    secret: Uint8Array,
    encryptedKey?: string | null,
    password?: string | null,
}

export type MasterKeyFile = {
    idmg: string,
    racine: {
        certificat: string,
        cleChiffree: string,
    }
}

async function parseFile(acceptedFiles: FileList): Promise<MasterKeyFile> {
    if(acceptedFiles.length !== 1) {
        throw new Error("Expecting a single uploaded file");
    }

    let file = acceptedFiles[0];
    if( file.type !== 'application/json' ) {
        throw new Error("Expecting a json file");
    }

    let reader = new FileReader();

    let fichierCharge = await new Promise((resolve, reject)=>{
        reader.onload = () => {
            let result = reader.result;
            if(!result) throw new Error("No content read");
            if(typeof(result) === 'string') throw new Error("Expecting Uint8Array instead of string");
            let resultString = new TextDecoder().decode(result);
            resolve(resultString);
        };
        reader.onerror = err => {
            reject(err);
        };
        reader.readAsArrayBuffer(file);
    }) as string;

    return JSON.parse(fichierCharge);
}

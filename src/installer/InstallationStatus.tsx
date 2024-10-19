import React, { Dispatch, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function InstallationStatus() {
    return (
        <>
            <Link to='/coupdoeil2/install'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4 pb-4'>Installation status</h1>

            <ApplicationsList />
            
        </>
    );
}

export default InstallationStatus;

function ApplicationsList() {

    let [apps, setApps] = useState(null as ApplicationsData | null);
    let [fiche, setFiche] = useState(null as any);

    useEffect(()=>{
        let interval = setInterval(()=>{
            refreshStatus(setApps, setFiche)
                .catch(err=>console.error("Error", err));
        }, 3_000);
        return () => clearInterval(interval);
    }, [setApps, setFiche]);

    let appElems = useMemo(()=>{
        if(!apps) return [];
        let appsCopy = [...Object.values(apps.apps)];
        appsCopy.sort((a: ApplicationInformation, b: ApplicationInformation)=>{
            if(a === b) return 0;
            let posA = a.status.pos;
            let posB = b.status.pos;
            if(typeof(posA) === 'number' && typeof(posB) === 'number') return posA - posB;
            if(!posA) return 1;
            if(!posB) return -1;
            return a.status.name.localeCompare(b.status.name);
        })

        return appsCopy.map(item=>{

            let downloadInfo = '';
            let downloading = item.downloading;
            if(downloading) {
                if(downloading.done) downloadInfo = 'Done';
                else if(downloading.pct) downloadInfo = `${downloading.pct}% (${downloading.total} bytes)`
                else if(downloading.current) downloadInfo = `${downloading.current}/${downloading.total}+ bytes`;
                else downloadInfo = 'N/A';
            }

            let appStatus = 'N/A';
            let status = item.status;
            if(status) {
                if(status.running) appStatus = 'Running';
                else if(status.preparing) appStatus = 'Preparing';
                else if(status.installed) appStatus = 'Installed';
                else if(status.disabled) appStatus = 'Disabled';
            }

            return (
                <React.Fragment key={item.status.name}>
                    <p>{item.status.name}</p>
                    <p>{downloadInfo}</p>
                    <p>{appStatus}</p>
                </React.Fragment>
            )
        });
    }, [apps]);

    if(!apps) return <p>Loading ...</p>;

    return (
        <>
            <div className='grid grid-cols-3 pb-6'>
                {appElems}
            </div>
            {fiche?
                <p>System ready</p>
                :
                <p>System initializing</p>
            }
        </>
    );
}

async function refreshStatus(setApps: Dispatch<ApplicationsData>, setFiche: Dispatch<any>) {
    let result = await axios({url: '/installation/api/appInstallationStatus', timeout: 3_000});
    let data = result.data as ApplicationsData;
    console.debug("resfresh info", result);
    setApps(data);

    try {
        let resultFiche = await axios({url: '/fiche.json', timeout: 3_000});
        let dataFiche = resultFiche.data;
        setFiche(dataFiche);
    } catch(err) {
        console.debug("Fiche not ready", err);
    }
}

type ApplicationsData = {
    apps: {[appName: string]: ApplicationInformation},
    ok: boolean,
    lastUpdate: number,
}

type ApplicationStatus = {
    name: string,
    pos?: number,
    disabled: boolean,
    installed: boolean,
    preparing: boolean,
    running: boolean,
};

type ApplicationInformation = {
    status: ApplicationStatus,
    downloading?: {
        current: number,
        total: number,
        remaining: number,
        done: boolean,
        pct?: number,
    }
}

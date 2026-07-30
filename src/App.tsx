import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ErrorPage } from './ErrorBoundary';
import InitializeWorkers from './workers/InitializeWorkers';

import './i18n';

import { InstanceEventHandler } from './instances/Instances';


const LandingPage = React.lazy(()=>import('./LandingPage'));

const Instances = React.lazy(()=>import('./instances/Instances'));
const InstanceList = React.lazy(()=>import('./instances/InstanceList'));
const InstanceDetail = React.lazy(()=>import('./instances/InstanceDetail'));
const InstanceInformation = React.lazy(()=>import('./instances/InstanceInformation'));
const InstanceConfigure = React.lazy(()=>import('./instances/InstanceConfigure'));
const InstanceApplicationPasswords = React.lazy(()=>import('./instances/InstanceApplicationPasswords'));

const Domains = React.lazy(()=>import('./domains/Domains'));
const DomainBackup = React.lazy(()=>import('./domains/DomainBackup'));
const DomainList = React.lazy(()=>import('./domains/DomainList'));
const DomainRestore = React.lazy(()=>import('./domains/DomainRestore'));
const DomainBackupVersions = React.lazy(()=>import('./domains/DomainBackupVersions'));

const Users = React.lazy(()=>import('./users/Users'));
const UserList = React.lazy(()=>import('./users/UserList'));
const UserDetail = React.lazy(()=>import('./users/UserDetail'));

const FileHosting = React.lazy(()=>import('./filehosting/FileHosting'));
const FileHostingList = React.lazy(()=>import('./filehosting/FileHostingList'));
const FileHostingAdd = React.lazy(()=>import('./filehosting/FileHostingAdd'));
const FileHostingEdit = React.lazy(()=>import('./filehosting/FileHostingEdit'));

const KeyManagement = React.lazy(()=>import('./utilities/KeyManagement'));
const KeyManagementOptions = React.lazy(()=>import('./utilities/KeyManagementOptions'));

const router = createBrowserRouter([
	{ path: "/coupdoeil2", element: <LandingPage />, errorElement: <ErrorPage /> },
	{
		path: "/coupdoeil2/instances",
		element: <Instances />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/instances", element: <InstanceList /> },
            { 
                path: "/coupdoeil2/instances/:instanceId", 
                element: <InstanceDetail />,
                children: [
                    { path: "/coupdoeil2/instances/:instanceId", element: <InstanceInformation /> },
                    { path: "/coupdoeil2/instances/:instanceId/configure", element: <InstanceConfigure /> },
                    { path: "/coupdoeil2/instances/:instanceId/passwords", element: <InstanceApplicationPasswords /> },
                ]
            },
        ]
  	},
    {
		path: "/coupdoeil2/domains",
		element: <Domains />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/domains", element: <DomainList /> },
            { path: "/coupdoeil2/domains/backup", element: <DomainBackup /> },
            { path: "/coupdoeil2/domains/restore", element: <DomainRestore /> },
            { path: "/coupdoeil2/domains/restore/versions/:domainName", element: <DomainBackupVersions back='/coupdoeil2/domains/restore' /> },
        ]
  	},
    {
		path: "/coupdoeil2/users",
		element: <Users />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/users", element: <UserList /> },
            { path: "/coupdoeil2/users/:userId", element: <UserDetail /> },
        ]
  	},
    {
		path: "/coupdoeil2/keys",
		element: <KeyManagement />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/keys", element: <KeyManagementOptions /> },
        ]
  	},
    {
		path: "/coupdoeil2/filehosting",
		element: <FileHosting />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/filehosting", element: <FileHostingList /> },
            { path: "/coupdoeil2/filehosting/add", element: <FileHostingAdd /> },
            { path: "/coupdoeil2/filehosting/filehost/:filehostId", element: <FileHostingEdit /> },
        ]
  	},
]);

function App() {

    return (
        <>
            <div className="App-background text-slate-300" translate='no'>
                <RouterProvider router={router} />
            </div>
            <InitializeWorkers />
            <InstanceEventHandler />
        </>
    );
    
}

export default App;

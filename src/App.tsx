import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ErrorPage } from './ErrorBoundary';
import InitializeWorkers from './workers/InitializeWorkers';

import './i18n';

import 'font-awesome/css/font-awesome.min.css';
import 'react-datetime/css/react-datetime.css';
import './App.css';
import { InstanceEventHandler } from './instances/Instances';
import ApplicationPackageList from './utilities/ApplicationPackageList';


const LandingPage = React.lazy(()=>import('./LandingPage'));

const Instances = React.lazy(()=>import('./instances/Instances'));
const InstanceList = React.lazy(()=>import('./instances/InstanceList'));
const InstanceDetail = React.lazy(()=>import('./instances/InstanceDetail'));
const InstanceApplications = React.lazy(()=>import('./instances/InstanceApplications'));
const InstanceInformation = React.lazy(()=>import('./instances/InstanceInformation'));
const InstanceConfigure = React.lazy(()=>import('./instances/InstanceConfigure'));
const InstanceInstallNewApplication = React.lazy(()=>import('./instances/InstanceInstallNewApplication'));
const InstanceApplicationPasswords = React.lazy(()=>import('./instances/InstanceApplicationPasswords'));
const InstanceAssociateNew = React.lazy(()=>import('./instances/InstanceAssociateNew'));

const Domains = React.lazy(()=>import('./domains/Domains'));
const DomainBackup = React.lazy(()=>import('./domains/DomainBackup'));
const DomainList = React.lazy(()=>import('./domains/DomainList'));
const DomainRestore = React.lazy(()=>import('./domains/DomainRestore'));

const Users = React.lazy(()=>import('./users/Users'));
const UserList = React.lazy(()=>import('./users/UserList'));
const UserDetail = React.lazy(()=>import('./users/UserDetail'));

// const FileManagement = React.lazy(()=>import('./consignation/FileManagement'));
// const FileManagerList = React.lazy(()=>import('./consignation/FileManagerList'));
// const FileManagerDetail = React.lazy(()=>import('./consignation/FileManagerInformation'));
// const FileManagerConfiguration = React.lazy(()=>import('./consignation/FileManagerConfiguration'));
// const FileManagerSftpConfiguration = React.lazy(()=>import('./consignation/FileManagerSftpConfiguration'));
const FileHosting = React.lazy(()=>import('./filehosting/FileHosting'));
const FileHostingList = React.lazy(()=>import('./filehosting/FileHostingList'));
const FileHostingAdd = React.lazy(()=>import('./filehosting/FileHostingAdd'));
const FileHostingEdit = React.lazy(()=>import('./filehosting/FileHostingEdit'));

const KeyManagement = React.lazy(()=>import('./utilities/KeyManagement'));
const KeyManagementOptions = React.lazy(()=>import('./utilities/KeyManagementOptions'));
const DecryptKeys = React.lazy(()=>import('./utilities/DecryptKeys'));
const ApplicationPackages = React.lazy(()=>import('./utilities/ApplicationPackages'));
const ApplicationPackageDetail = React.lazy(()=>import('./utilities/ApplicationPackageDetail'));
const Installer = React.lazy(()=>import('./installer/Installer'));
const InstallSelect = React.lazy(()=>import('./installer/InstallSelect'));
const Install4Secure = React.lazy(()=>import('./installer/Install4Secure'));
const Install3Protege = React.lazy(()=>import('./installer/Install3Protege'));
const Install2Prive = React.lazy(()=>import('./installer/Install2Prive'));
const Install1Public = React.lazy(()=>import('./installer/Install1Public'));
const InstallationStatus = React.lazy(()=>import('./installer/InstallationStatus'));

const router = createBrowserRouter([
	{ path: "/coupdoeil2", element: <LandingPage />, errorElement: <ErrorPage /> },
	{
		path: "/coupdoeil2/instances",
		element: <Instances />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/instances", element: <InstanceList /> },
            { path: "/coupdoeil2/instances/associate", element: <InstanceAssociateNew /> },
            { 
                path: "/coupdoeil2/instances/:instanceId", 
                element: <InstanceDetail />,
                children: [
                    { path: "/coupdoeil2/instances/:instanceId", element: <InstanceApplications /> },
                    { path: "/coupdoeil2/instances/:instanceId/info", element: <InstanceInformation /> },
                    { path: "/coupdoeil2/instances/:instanceId/configure", element: <InstanceConfigure /> },
                    { path: "/coupdoeil2/instances/:instanceId/newApplication", element: <InstanceInstallNewApplication /> },
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
            { path: "/coupdoeil2/keys/decrypt", element: <DecryptKeys /> },
        ]
  	},
    {
		path: "/coupdoeil2/applicationPackages",
		element: <ApplicationPackages />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/applicationPackages", element: <ApplicationPackageList /> },
            { path: "/coupdoeil2/applicationPackages/:packageName", element: <ApplicationPackageDetail /> },
        ]
  	},
    // {
	// 	path: "/coupdoeil2/fileManagement",
	// 	element: <FileManagement />,
    //     errorElement: <ErrorPage />,
    //     children: [
    //         { path: "/coupdoeil2/fileManagement", element: <FileManagerList /> },
    //         { path: "/coupdoeil2/fileManagement/:instanceId", element: <FileManagerDetail /> },
    //         { path: "/coupdoeil2/fileManagement/:instanceId/configure", element: <FileManagerConfiguration /> },
    //     ]
  	// },
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
    {
		path: "/coupdoeil2/install",
		element: <Installer />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/install", element: <InstallSelect /> },
            { path: "/coupdoeil2/install/4secure", element: <Install4Secure /> },
            { path: "/coupdoeil2/install/3protege", element: <Install3Protege /> },
            { path: "/coupdoeil2/install/2private", element: <Install2Prive /> },
            { path: "/coupdoeil2/install/1public", element: <Install1Public /> },
            { path: "/coupdoeil2/install/status", element: <InstallationStatus /> },
        ]
  	},
]);

function App() {

    return (
        <>
            <div className="App-background text-slate-300">
                <RouterProvider router={router} />
            </div>
            <InitializeWorkers />
            <InstanceEventHandler />
        </>
    );
    
}

export default App;

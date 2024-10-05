import React from 'react';
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";

import { ErrorPage } from './ErrorBoundary';
import InitializeWorkers from './workers/InitializeWorkers';

import './i18n';

import 'font-awesome/css/font-awesome.min.css';
import 'react-datetime/css/react-datetime.css';
import './App.css';


const LandingPage = React.lazy(()=>import('./LandingPage'));
const Instances = React.lazy(()=>import('./instances/Instances'));

const Domains = React.lazy(()=>import('./domains/Domains'));
const DomainBackup = React.lazy(()=>import('./domains/DomainBackup'));
const DomainList = React.lazy(()=>import('./domains/DomainList'));
const DomainRestore = React.lazy(()=>import('./domains/DomainRestore'));

const Users = React.lazy(()=>import('./users/Users'));
const KeyManagement = React.lazy(()=>import('./utilities/KeyManagement'));
const KeyManagementOptions = React.lazy(()=>import('./utilities/KeyManagementOptions'));
const DecryptKeys = React.lazy(()=>import('./utilities/DecryptKeys'));
const ApplicationPackages = React.lazy(()=>import('./utilities/ApplicationPackages'));
const ConsignationFichiers = React.lazy(()=>import('./consignation/ConsignationFichiers'));
const Installer = React.lazy(()=>import('./installer/Installer'));
const InstallSelect = React.lazy(()=>import('./installer/InstallSelect'));
const Install3Protege = React.lazy(()=>import('./installer/Install3Protege'));

const router = createBrowserRouter([
	{
	  	path: "/coupdoeil2",
	  	element: <LandingPage />,
		  errorElement: <ErrorPage />
	},
	{
		path: "/coupdoeil2/instances",
		element: <Instances />,
        errorElement: <ErrorPage />,
        children: [
            // { path: "/apps/aichat", element: <ChatSummaryHistory /> },
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
            // { path: "/apps/aichat", element: <ChatSummaryHistory /> },
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
            // { path: "/apps/aichat", element: <ChatSummaryHistory /> },
        ]
  	},
    {
		path: "/coupdoeil2/consignation",
		element: <ConsignationFichiers />,
        errorElement: <ErrorPage />,
        children: [
            // { path: "/apps/aichat", element: <ChatSummaryHistory /> },
        ]
  	},
      {
		path: "/coupdoeil2/install",
		element: <Installer />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/coupdoeil2/install", element: <InstallSelect /> },
            { path: "/coupdoeil2/install/3protege", element: <Install3Protege /> },
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
        </>
    );
    
}

export default App;

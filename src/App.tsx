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
const Users = React.lazy(()=>import('./users/Users'));
const DecryptKeys = React.lazy(()=>import('./utilities/DecryptKeys'));
const ApplicationPackages = React.lazy(()=>import('./utilities/ApplicationPackages'));
const ConsignationFichiers = React.lazy(()=>import('./consignation/ConsignationFichiers'));
const Installer = React.lazy(()=>import('./installer/Installer'));

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
            // { path: "/apps/aichat", element: <ChatSummaryHistory /> },
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
		path: "/coupdoeil2/decryptKeys",
		element: <DecryptKeys />,
        errorElement: <ErrorPage />,
        children: [
            // { path: "/apps/aichat", element: <ChatSummaryHistory /> },
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
            // { path: "/apps/aichat", element: <ChatSummaryHistory /> },
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

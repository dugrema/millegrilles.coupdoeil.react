import React from 'react';
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";

import { ErrorPage } from './ErrorBoundary';
// import InitializeWorkers from './workers/InitializeWorkers';

// import HeaderMenu from './Menu';
// import Footer from './Footer';

import './i18n';

import 'font-awesome/css/font-awesome.min.css';
import 'react-datetime/css/react-datetime.css';
import './App.css';


const LandingPage = React.lazy(()=>import('./LandingPage'));

const router = createBrowserRouter([
	{
	  	path: "/coupdoeil",
	  	element: <LandingPage />,
		  errorElement: <ErrorPage />
	},
	// {
	// 	path: "/coupdoeil/aichat",
	// 	element: <AppAiChat />,
  //       errorElement: <ErrorPage />,
  //       children: [
  //           { path: "/apps/aichat", element: <ChatSummaryHistory /> },
  //           { path: "/apps/aichat/newConversation", element: <AiChatConversation /> },
  //           { path: "/apps/aichat/conversation/:conversationId", element: <AiChatConversation /> },
  //       ]
  // 	},
]);

function App() {

    // let logoutHandler: MouseEventHandler<MouseEvent> = useCallback(()=>{
    //     window.location.href = '/auth/deconnecter_usager';
    // }, []);

    return (
        <>
            <div className="App-background text-slate-300">
                <RouterProvider router={router} />
            </div>
            {/* <InitializeWorkers /> */}
        </>
    );
}

export default App;

// function ApplicationList() {
//     return (
//         <div>
//             <HeaderMenu title='MilleGrilles' />

//             <main className='fixed top-6 bottom-8 overflow-y-auto pt-4 pb-2 pl-2 pr-2 w-full'>
//                 <section>
//                     <h1 className='text-xl font-bold'>Application list</h1>
//                     <nav className='pt-6'>
//                         <ul>
//                             <li className='pt-2'><Link className='underline' to='/apps/aichat'>Ai Chat</Link></li>
//                             <li className='pt-2'><Link className='underline'to='/apps/notepad'>Notepad</Link></li>
//                             <li className='pt-2'><Link className='underline'to='/apps/senseurspassifs'>SenseursPassifs</Link></li>
//                             <li className='pt-2'><a href='/millegrilles' className='underline'>Back to portal</a></li>
//                         </ul>
//                     </nav>
//                 </section>
//             </main>
            
//             <Footer />
//         </div>
//     )
// }

import React from 'react';
import ReactDOM from 'react-dom/client';
import Loading from './Loading';

// Global imports
import './index.css';
import '@solana/webcrypto-ed25519-polyfill';
import ErrorBoundary from './ErrorBoundary';

const App = React.lazy(()=>import('./App'));

const root = ReactDOM.createRoot(
  	document.getElementById('root') as HTMLElement
);
root.render(
  	<React.StrictMode>
  		<React.Suspense fallback={<Loading />}>
  			<ErrorBoundary>
  				<App />
  			</ErrorBoundary>
  		</React.Suspense>
  	</React.StrictMode>
);

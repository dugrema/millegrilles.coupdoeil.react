import { Component } from 'react'
import { useRouteError } from "react-router-dom";

class ErrorBoundary extends Component {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }
  
    componentDidCatch(error: any, errorInfo: any) {
        // Transfert the error code to state
        let errorCode = error.code;
        this.setState({...this.state, errorCode});
        console.error("componentDidCatch Error:\n%O\n%O", error, errorInfo);
    }
  
    render() {
        // @ts-ignore
        if(this.state.hasError) {
            return (
                <div className="App">
                    <header className="App-header text-slate-300 flex-1 content-center loading">
                        <h1 style={{'paddingTop': '1.5rem', 'paddingBottom': '1.7rem'}}>MilleGrilles</h1>
                        <p>An error occurred. The page cannot be loaded a this time.</p>
                                <button onClick={reload}
                                    className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                                        Retry
                                </button>

                        <div style={{height: '20vh'}}></div>
                    </header>
                </div>
            )
        }
        // @ts-ignore
        return this.props.children;
    }
}

export default ErrorBoundary

function reload() {
    window.location.reload()
}

export function ErrorPage() {
    const error = useRouteError() as any;
    console.error(error);
  
    return (
        <div className="App">
            <header className="App-header text-slate-300 flex-1 content-center loading">
                <h1 style={{'paddingTop': '1.5rem', 'paddingBottom': '1.7rem'}}>MilleGrilles</h1>
                <p>An error occurred. The page cannot be loaded a this time.</p>
                                <button onClick={reload}
                                    className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                                        Retry
                                </button>

                <div style={{height: '20vh'}}></div>
            </header>
        </div>
    );
}

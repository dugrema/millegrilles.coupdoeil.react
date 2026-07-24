import VersionInfo from "./VersionInfo";

export default function Footer() {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-t border-slate-700 py-2 text-center">
            <div className="max-w-screen-2xl mx-auto px-6">
                <VersionInfo />
            </div>
        </footer>
    )
}

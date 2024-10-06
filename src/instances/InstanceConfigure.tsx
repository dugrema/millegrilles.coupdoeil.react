function InstanceConfigure() {
    return (
        <>
            <section>
                <h2 className='text-lg font-bold pt-4'>Configure</h2>
            </section>

            <section className='pt-10'>
                <h2 className='text-lg font-bold pt-4'>Danger zone</h2>
                <button 
                    className='btn inline-block text-center bg-red-700 hover:bg-red-500 active:bg-red-600'>
                        Delete instance
                </button>
            </section>
        </>
    )
};

export default InstanceConfigure;

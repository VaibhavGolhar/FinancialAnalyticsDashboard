import {useEffect, useState} from 'react'
import './App.css'

function App() {
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetch('/api/health')
            .then((res) => res.text()) // or res.json() depending on your API response
            .then((data) => setMsg(data))
            .catch((err) => setMsg('Error: ' + err.message));
    }, []);

    return <div>{msg}</div>;
}

export default App

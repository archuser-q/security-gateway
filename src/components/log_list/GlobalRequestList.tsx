import { useEffect, useState } from "react"

export const GlobalRequestList = () => {
    const [logs, setLogs] = useState<string[]>();

    const handleOpen = () => {
        fetch('/logs/access.log')
            .then(r => r.text())
            .then(text => {
                const lines = text
                    .split('\n');
                setLogs(lines);
            });
    };

    const content = logs?.map((line, index) => (
        <p key={index}>
            {line}
        </p>
    ));

    useEffect(()=> {
        handleOpen();
        const interval = setInterval(handleOpen, 2000)

        return () => clearInterval(interval)
    },[])

    return(
        <div>
            {content}
        </div>
    )
}
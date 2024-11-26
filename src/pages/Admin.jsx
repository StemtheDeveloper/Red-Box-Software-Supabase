import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const Admin = () => {
    const [file, setFile] = useState(null)
    const [message, setMessage] = useState('')
    const [user, setUser] = useState(null)

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setUser(session.user)
            } else {
                window.location.href = '/404';


            }
        }
        getSession()
    }, [])

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file to upload.')
            return
        }
        try {
            if (user.email !== 'stiaan44@gmail.com') {
                setMessage('Access denied.')
                alert('Access denied.')
                return
            }
            const filePath = `uploads/${file.name}`
            await supabase.storage.from('your-bucket-name').upload(filePath, file)
            setMessage('File uploaded successfully.')
        } catch (error) {
            setMessage(`Error uploading file: ${error.message}`)
        }
    }

    if (!user) {
        return <p>{message}</p>
    }

    return (
        <div className='admin-page'>
            <h1>Admin Page</h1>
            <div className='profile-image'>
                <img src={user.user_metadata.avatar_url} alt="Profile" />
                <p>{user.email}</p>
            </div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            <p>{message}</p>
        </div>
    )
}

export default Admin
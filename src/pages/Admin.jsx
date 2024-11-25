
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const Admin = () => {
    const [file, setFile] = useState(null)
    const [message, setMessage] = useState('')

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file to upload.')
            return
        }
        try {
            const user = supabase.auth.user()
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

    return (
        <div className='admin-page'>
            <h1>Admin Page</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            <p>{message}</p>
        </div>
    )
}

export default Admin
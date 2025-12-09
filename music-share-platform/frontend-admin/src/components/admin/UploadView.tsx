import { useState } from 'react';
import { adminAPI } from '../../services/api';
import { PageTransition } from '../PageTransition';
import { Upload, Music, Disc, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function UploadView() {
    const [file, setFile] = useState<File | null>(null);
    const [form, setForm] = useState({ title: '', artist: '', album: '' });
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert('Please select a file.');

        const data = new FormData();
        data.append('file', file);
        data.append('title', form.title);
        data.append('artist', form.artist);
        if (form.album) data.append('album', form.album);

        setUploading(true);
        try {
            await adminAPI.uploadTrack(data);
            alert('Track uploaded successfully!');
            setFile(null);
            setForm({ title: '', artist: '', album: '' });
        } catch (error: any) {
            alert('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <PageTransition className="p-8 max-w-2xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Track</h1>
                <p className="text-gray-500">Add new music to your library</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleUpload} className="space-y-6">

                    {/* File Drop Area */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Audio File</label>
                        <div className={cn(
                            "border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer",
                            file ? "border-indigo-200 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer block">
                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                            <Music className="w-6 h-6" />
                                        </div>
                                        <p className="font-medium text-indigo-900">{file.name}</p>
                                        <p className="text-xs text-indigo-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Upload className="w-10 h-10 mb-2" />
                                        <span className="text-sm font-medium text-gray-600">Click to upload or drag and drop</span>
                                        <span className="text-xs">MP3, WAV, FLAC supported</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="grid gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Track Title</label>
                            <div className="relative">
                                <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                                    placeholder="e.g. Summer Vibes"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Artist</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={form.artist}
                                        onChange={e => setForm({ ...form, artist: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                                        placeholder="Artist Name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Album (Optional)</label>
                                <div className="relative">
                                    <Disc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.album}
                                        onChange={e => setForm({ ...form, album: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                                        placeholder="Album Name"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-xl shadow-lg shadow-gray-200 hover:shadow-gray-300 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                    >
                        {uploading ? 'Uploading...' : 'Upload Track'}
                    </button>
                </form>
            </div>
        </PageTransition>
    );
}

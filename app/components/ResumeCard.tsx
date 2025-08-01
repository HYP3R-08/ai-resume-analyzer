import React, {useEffect, useState} from 'react';
import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({resume: {id, companyName, jobTitle, feedback, imagePath}}: {resume: Resume}) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const loadResume = async () => {
            try {
                const blob = await fs.read(imagePath);
                if(!blob) {
                    setImageError(true);
                    return;
                }
                const url = URL.createObjectURL(blob);
                setResumeUrl(url);
            } catch (error) {
                console.error("Error loading resume image:", error);
                setImageError(true);
            }
        };

        if (imagePath) {
            loadResume();
        }

        // Cleanup function per liberare l'URL quando il componente viene smontato
        return () => {
            if (resumeUrl) {
                URL.revokeObjectURL(resumeUrl);
            }
        };
    }, [imagePath, fs]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold">Untitled Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback?.overallScore || 0}/>
                </div>
            </div>

            {/* Mostra l'immagine solo se è caricata correttamente */}
            {resumeUrl && !imageError ? (
                <div className="gradient-border animate-in fade-in duration-1000">
                    <div className="w-full h-full">
                        <img
                            src={resumeUrl}
                            alt="resume preview"
                            className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                            onError={() => setImageError(true)}
                        />
                    </div>
                </div>
            ) : imageError ? (
                <div className="gradient-border">
                    <div className="w-full h-[350px] max-sm:h-[200px] bg-gray-100 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="text-4xl mb-2">📄</div>
                            <p>Preview not available</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="gradient-border">
                    <div className="w-full h-[350px] max-sm:h-[200px] bg-gray-100 animate-pulse flex items-center justify-center">
                        <div className="text-gray-400">Loading...</div>
                    </div>
                </div>
            )}
        </Link>
    );
};

export default ResumeCard;
import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
    {title: 'Resumind | Review'},
    {name: 'description', content: 'Detailed overview of your resume'},
])

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading]);

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);

            if(!resume) return;

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if(!imageBlob) return;
            const imageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageUrl);

            setFeedback(data.feedback);
            console.log({resumeUrl, imageUrl, feedback: data.feedback});
        }

        loadResume();
    }, [id]);

    return (
        <main className="!pt-0 min-h-screen">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>

            {/* Layout principale con grid responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">

                {/* Sezione immagine - a sinistra su desktop, in basso su mobile */}
                <section className="bg-[url('/images/bg-small.svg')] bg-cover bg-center flex items-center justify-center p-4 lg:sticky lg:top-0 lg:h-screen order-2 lg:order-1">
                    {imageUrl && resumeUrl ? (
                        <div className="animate-in fade-in duration-1000 gradient-border w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl h-auto">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                    src={imageUrl}
                                    className="w-full h-auto max-h-[80vh] lg:max-h-[85vh] xl:max-h-[90vh] object-contain rounded-2xl shadow-lg"
                                    title="resume"
                                    alt="Resume preview"
                                    style={{maxWidth: '600px', margin: '0 auto'}}
                                />
                            </a>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <div className="animate-pulse bg-gray-200 rounded-2xl w-full max-w-md aspect-[3/4] max-h-[80vh]"></div>
                        </div>
                    )}
                </section>

                {/* Sezione feedback - a destra su desktop, in alto su mobile */}
                <section className="bg-white flex flex-col p-6 lg:p-8 xl:p-12 order-1 lg:order-2 min-h-screen lg:overflow-y-auto">
                    <div className="w-full max-w-4xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl xl:text-5xl !text-black font-bold mb-8">
                            Resume Review
                        </h2>

                        {feedback ? (
                            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                                <Summary feedback={feedback} />
                                <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                                <Details feedback={feedback}/>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-12">
                                <img
                                    src="/images/resume-scan-2.gif"
                                    className="w-full max-w-md"
                                    alt="Loading animation"
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Resume;
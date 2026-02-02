import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';

const Terms = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <BackButton />
                <h1 className="text-4xl font-fredoka font-bold mb-8">Terms of Service</h1>
                <div className="prose prose-lg font-nunito text-muted-foreground">
                    <p className="mb-4">Welcome to Happy Hopz. By using our website and services, you agree to the following terms and conditions.</p>

                    <h2 className="text-2xl font-fredoka font-bold text-foreground mt-8 mb-4">Use of the Site</h2>
                    <p className="mb-4">You may use our site and services only for lawful purposes and in accordance with these Terms.</p>

                    <h2 className="text-2xl font-fredoka font-bold text-foreground mt-8 mb-4">Purchases</h2>
                    <p className="mb-4">By placing an order, you represent that you are at least the age of majority in your state or province of residence.</p>

                    <h2 className="text-2xl font-fredoka font-bold text-foreground mt-8 mb-4">Limitation of Liability</h2>
                    <p className="mb-4">Happy Hopz shall not be liable for any special or consequential damages that result from the use of, or the inability to use, the materials on this site.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;

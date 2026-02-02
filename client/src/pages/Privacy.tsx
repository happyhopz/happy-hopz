import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <BackButton />
                <h1 className="text-4xl font-fredoka font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-lg font-nunito text-muted-foreground">
                    <p className="mb-4">At Happy Hopz, we take your privacy seriously. This policy describes what personal information we collect and how we use it.</p>

                    <h2 className="text-2xl font-fredoka font-bold text-foreground mt-8 mb-4">Information We Collect</h2>
                    <p className="mb-4">We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>

                    <h2 className="text-2xl font-fredoka font-bold text-foreground mt-8 mb-4">How We Use Your Information</h2>
                    <p className="mb-4">We use your information to process your orders, communicate with you about your account, and improve our services.</p>

                    <h2 className="text-2xl font-fredoka font-bold text-foreground mt-8 mb-4">Security</h2>
                    <p className="mb-4">We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;

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
                <div className="prose prose-lg font-nunito text-muted-foreground max-w-none">
                    <p className="mb-6">Last Updated: February 2026</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">1. Introduction</h2>
                        <p>Welcome to Happy Hopz. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">2. The Data We Collect</h2>
                        <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Identity Data:</strong> Includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data:</strong> Includes billing address, delivery address, email address and telephone numbers.</li>
                            <li><strong>Financial Data:</strong> Includes payment card details (processed securely via our payment gateways).</li>
                            <li><strong>Transaction Data:</strong> Includes details about payments to and from you and other details of products you have purchased from us.</li>
                            <li><strong>Technical Data:</strong> Includes internet protocol (IP) address, your login data, browser type and version, and location.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">3. How We Use Your Data</h2>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To register you as a new customer.</li>
                            <li>To process and deliver your order including managing payments, fees and charges.</li>
                            <li>To manage our relationship with you including notifying you about changes to our terms or privacy policy.</li>
                            <li>To deliver relevant website content and advertisements to you.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">4. Data Security</h2>
                        <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">5. Your Legal Rights</h2>
                        <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing of your personal data.</p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;

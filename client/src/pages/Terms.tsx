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
                <div className="prose prose-lg font-nunito text-muted-foreground max-w-none">
                    <p className="mb-6">Last Updated: February 2026</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">1. Agreement to Terms</h2>
                        <p>By accessing or using the Happy Hopz website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">2. Use License</h2>
                        <p>Permission is granted to temporarily download one copy of the materials on Happy Hopz's website for personal, non-commercial transitory viewing only.</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>You may not modify or copy the materials.</li>
                            <li>You may not use the materials for any commercial purpose.</li>
                            <li>You may not attempt to decompile or reverse engineer any software contained on the website.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">3. Products & Pricing</h2>
                        <p>All products are subject to availability. We reserve the right to limit the quantities of any products or services that we offer. All descriptions of products or product pricing are subject to change at any time without notice, at our sole discretion.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">4. Shipping & Delivery</h2>
                        <p>Standard delivery timelines are between 3-7 business days. While we strive to deliver within the estimated timelines, Happy Hopz shall not be liable for any delays caused by third-party logistics partners or unforeseen circumstances.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">5. Returns & Refunds</h2>
                        <p>Please refer to our <a href="/returns" className="text-primary font-bold">Returns Policy</a> for detailed information about our 14-day easy return and exchange process.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">6. Governing Law</h2>
                        <p>These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;

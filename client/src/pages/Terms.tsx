import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Helmet } from 'react-helmet-async';

const Terms = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Terms & Conditions | Happy Hopz</title>
                <meta name="description" content="Happy Hopz Terms of Service - Review our agreements, policies, and legal guidelines." />
            </Helmet>
            <Navbar />
            <main className="container mx-auto px-4 py-8 lg:py-12">
                <BackButton />
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-fredoka font-bold mb-8 text-primary">Terms & Conditions</h1>
                    <div className="prose prose-lg font-nunito text-muted-foreground max-w-none space-y-8">
                        <p className="text-sm italic">Last Updated: February 15, 2026</p>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                            <p>By accessing and using www.happyhopz.com (the "Site"), you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please refrain from using our Site. These terms apply to all visitors, users, and others who access the Site.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">2. Eligibility</h2>
                            <p>You must be at least 18 years of age to make a purchase on our Site. If you are under 18, you may use the Site only with the involvement of a parent or guardian. By using the Site, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">3. Accuracy of Information</h2>
                            <p>While we strive for absolute accuracy, Happy Hopz does not warrant that product descriptions, pricing, or other content on this Site is 100% accurate, complete, or error-free. In the event of a pricing error, we reserve the right to cancel any orders placed for that product at the incorrect price, even after an order confirmation has been sent.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">4. Shipping & Delivery</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Processing Time:</strong> Most orders are processed within 24-48 business hours.</li>
                                <li><strong>Delivery Estimates:</strong> Standard delivery typically takes <strong>3-5 business days</strong> across India.</li>
                                <li><strong>Liability:</strong> Happy Hopz is not responsible for delays caused by third-party logistics partners, weather conditions, or local restrictions. Our liability for non-delivery is limited to a full refund of the amount paid for the order.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">5. Returns, Exchanges & Refunds</h2>
                            <p>Our commitment to your satisfaction includes a professional return policy:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Window:</strong> Returns and exchanges must be initiated within <strong>7 days</strong> of delivery.</li>
                                <li><strong>Condition:</strong> Items must be unworn, in original packaging, with all tags attached.</li>
                                <li><strong>Refunds:</strong> Online payments are refunded to the original payment source. Pay on Delivery (COD) orders are refunded via store credit or bank transfer upon verification.</li>
                                <li><strong>Pickup Charge:</strong> A nominal pickup charge of <strong>₹50</strong> is applicable for returns to cover logistics costs.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">6. Payment Terms</h2>
                            <p>We accept payments via Razorpay (Credit/Debit Cards, UPI, Net Banking) and Pay on Delivery (for eligible pin codes). Payment must be received by us before our acceptance of an order. For COD orders, all payments must be made in cash/digital transfer to the delivery agent at the time of delivery.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">7. Intellectual Property</h2>
                            <p>All content included on this Site, such as text, graphics, logos (including the Happy Hopz panda), images, and software, is the property of Happy Hopz and protected by Indian and international copyright laws. Any unauthorized use or reproduction is strictly prohibited.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">8. Limitation of Liability</h2>
                            <p>Happy Hopz shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or the inability to use the Site or for the cost of procurement of substitute goods.</p>
                        </section>

                        <section className="bg-muted p-6 rounded-2xl border border-border">
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">9. Governing Law</h2>
                            <p className="text-foreground">These Terms and Conditions and your use of the Site are governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts in <strong>[Insert City/State, e.g., Delhi/NCR]</strong>.</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Helmet } from 'react-helmet-async';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Privacy Policy | Happy Hopz</title>
                <meta name="description" content="Happy Hopz Privacy Policy - Learn how we collect, use, and protect your personal data." />
            </Helmet>
            <Navbar />
            <main className="container mx-auto px-4 py-8 lg:py-12">
                <BackButton />
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-fredoka font-bold mb-8 text-primary">Privacy Policy</h1>
                    <div className="prose prose-lg font-nunito text-muted-foreground max-w-none space-y-8">
                        <p className="text-sm italic">Last Updated: February 15, 2026</p>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">1. Commitment to Privacy</h2>
                            <p>Happy Hopz ("we," "us," or "our") is dedicated to protecting the privacy of our customers and visitors. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information when you use our website www.happyhopz.com (the "Site"). By using the Site, you consent to the data practices described in this policy in accordance with the Information Technology Act, 2000 and the Rules made thereunder.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">2. Collection of Information</h2>
                            <p>We collect information to provide better services to our users. This includes:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <h3 className="font-bold text-foreground mb-2">Personal Identity Data</h3>
                                    <p className="text-sm">Name, email address, phone number, and account credentials provided during registration or checkout.</p>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <h3 className="font-bold text-foreground mb-2">Transaction & Delivery Data</h3>
                                    <p className="text-sm">Shipping/billing addresses, order details, and purchase history required for fulfillment.</p>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <h3 className="font-bold text-foreground mb-2">Technical & Usage Data</h3>
                                    <p className="text-sm">IP address, browser type, device information, and interaction data collected via cookies and analytics.</p>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <h3 className="font-bold text-foreground mb-2">Communication Data</h3>
                                    <p className="text-sm">Preferences for receiving marketing materials and your record of correspondence with our support team.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">3. Payment Processing & Security</h2>
                            <p>We use **Razorpay** as our third-party payment gateway. Happy Hopz does not store your credit card, debit card, or UPI credentials on our servers. Your financial information is collected and processed directly by Razorpay, which is compliant with the Payment Card Industry Data Security Standard (PCI-DSS). Their use of your personal information is governed by their own Privacy Policy.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">4. Use of Your Information</h2>
                            <p>We use the collected data for the following purposes:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To process, fulfill, and ship your orders efficiently.</li>
                                <li>To send order confirmations and tracking updates via Email, SMS, and WhatsApp.</li>
                                <li>To provide customer support and respond to inquiries.</li>
                                <li>To improve Site functionality and personalize your shopping experience.</li>
                                <li>To comply with legal obligations and prevent fraudulent transactions.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">5. Cookies and Tracking</h2>
                            <p>Our website uses "cookies" to enhance your experience. Cookies are small text files placed on your device to collect standard internet log information and visitor behavior information. You can set your browser not to accept cookies, though some website features may not function as a result.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">6. Third-Party Sharing</h2>
                            <p>We do not sell, rent, or lease our customer lists to third parties. We may share data with trusted partners to help perform statistical analysis, send you email or postal mail, provide customer support, or arrange for deliveries (e.g., sharing your address with shipping partners). All such third parties are prohibited from using your personal information except to provide these services to Happy Hopz.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-fredoka font-bold text-foreground mb-4">7. Data Retention & Your Rights</h2>
                            <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Request access to the personal data we hold about you.</li>
                                <li>Request corrections to any inaccurate or incomplete data.</li>
                                <li>Request the deletion of your account (subject to certain legal exceptions like pending orders or tax records).</li>
                                <li>Withdraw consent for marketing communications at any time.</li>
                            </ul>
                        </section>

                        <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                            <h2 className="text-2xl font-fredoka font-bold text-primary mb-4">Contact Us</h2>
                            <p className="text-foreground">If you have any questions about this Privacy Policy or our treatment of your personal data, please write to us at:</p>
                            <p className="mt-2 font-bold text-foreground">Email: happyhopz308@gmail.com</p>
                            <p className="text-foreground text-sm mt-4 italic">Happy Hopz Customer Privacy Office, India</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;

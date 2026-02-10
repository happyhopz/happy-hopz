import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Truck, Clock, MapPin, Package, CheckCircle, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Shipping = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-4">
                {/* Back Button */}
                <div className="container mx-auto px-4 mb-4">
                    <BackButton />
                </div>

                {/* Header */}
                <section className="bg-gradient-to-br from-pink-50 via-cyan-50 to-purple-50 py-10">
                    <div className="container mx-auto px-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Truck className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-foreground mb-4">
                            Shipping <span className="text-primary">Information</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-nunito max-w-2xl mx-auto">
                            Free shipping across India on orders above ₹999.
                        </p>
                    </div>
                </section>

                {/* Shipping Info */}
                <section className="py-10">
                    <div className="container mx-auto px-4 max-w-4xl">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <HighlightCard
                                icon={<Truck className="w-8 h-8" />}
                                title="Free Shipping"
                                description="On orders above ₹999"
                            />
                            <HighlightCard
                                icon={<Clock className="w-8 h-8" />}
                                title="3-7 Days"
                                description="Standard delivery"
                            />
                            <HighlightCard
                                icon={<MapPin className="w-8 h-8" />}
                                title="Pan India"
                                description="We deliver everywhere"
                            />
                        </div>

                        {/* Details */}
                        <div className="space-y-8">
                            <Section title="Delivery Timeline">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 font-nunito font-bold">Region</th>
                                            <th className="text-left py-3 font-nunito font-bold">Estimated Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-nunito text-muted-foreground">
                                        <tr className="border-b">
                                            <td className="py-3">Metro Cities (Delhi, Mumbai, Bangalore, etc.)</td>
                                            <td className="py-3">3-5 business days</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="py-3">Tier 2 Cities</td>
                                            <td className="py-3">4-6 business days</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="py-3">Tier 3 Cities & Rural Areas</td>
                                            <td className="py-3">5-7 business days</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="py-3">Remote Areas (Northeast, Islands, etc.)</td>
                                            <td className="py-3">7-10 business days</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Section>

                            <Section title="Order Processing">
                                <ul className="space-y-3 text-muted-foreground font-nunito">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>Orders placed before 2 PM are processed the same day</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>Orders placed after 2 PM or on weekends are processed the next business day</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>You'll receive tracking information via email and SMS once shipped</span>
                                    </li>
                                </ul>
                            </Section>

                            <Section title="Delivery Partners">
                                <p className="text-muted-foreground font-nunito mb-4">
                                    We partner with trusted logistics providers to ensure safe and timely delivery:
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    {['Delhivery', 'BlueDart', 'DTDC', 'Ecom Express'].map(partner => (
                                        <span key={partner} className="px-4 py-2 bg-muted rounded-lg font-nunito text-sm">
                                            {partner}
                                        </span>
                                    ))}
                                </div>
                            </Section>

                            <Section title="Important Notes">
                                <ul className="space-y-3 text-muted-foreground font-nunito">
                                    <li className="flex items-start gap-3">
                                        <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Delivery timelines may vary during sale periods or festivals</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Please ensure someone is available to receive the package</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Our delivery partner will attempt delivery 3 times before returning the package</span>
                                    </li>
                                </ul>
                            </Section>
                        </div>

                        {/* CTA */}
                        <div className="mt-12 p-8 bg-primary/5 rounded-2xl text-center">
                            <h3 className="text-xl font-fredoka font-bold mb-2">Have Questions?</h3>
                            <p className="text-muted-foreground font-nunito mb-4">
                                Contact us for any shipping-related queries
                            </p>
                            <a
                                href="/contact"
                                className="inline-block bg-primary text-white px-6 py-2 rounded-full font-nunito font-bold hover:bg-primary/90 transition-colors"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

const HighlightCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <Card className="p-6 text-center shadow-card">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            {icon}
        </div>
        <h3 className="font-fredoka font-bold text-lg">{title}</h3>
        <p className="text-muted-foreground font-nunito text-sm">{description}</p>
    </Card>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <h2 className="text-xl font-fredoka font-bold mb-4">{title}</h2>
        {children}
    </div>
);

export default Shipping;

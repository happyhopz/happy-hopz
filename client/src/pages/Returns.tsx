import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { RotateCcw, CheckCircle, XCircle, AlertCircle, Package, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Returns = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-8">
                {/* Back Button */}
                <div className="container mx-auto px-4 mb-4">
                    <BackButton />
                </div>

                {/* Header */}
                <section className="bg-gradient-to-br from-pink-50 via-cyan-50 to-purple-50 py-16">
                    <div className="container mx-auto px-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <RotateCcw className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-foreground mb-4">
                            Returns & <span className="text-primary">Exchanges</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-nunito max-w-2xl mx-auto">
                            Easy 14-day returns. No questions asked. Your satisfaction is our priority!
                        </p>
                    </div>
                </section>

                {/* Returns Policy */}
                <section className="py-16">
                    <div className="container mx-auto px-4 max-w-4xl">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <Card className="p-6 text-center shadow-card">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <h3 className="font-fredoka font-bold text-lg">14 Days</h3>
                                <p className="text-muted-foreground font-nunito text-sm">Return window</p>
                            </Card>
                            <Card className="p-6 text-center shadow-card">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600">
                                    <Package className="w-8 h-8" />
                                </div>
                                <h3 className="font-fredoka font-bold text-lg">Free Pickup</h3>
                                <p className="text-muted-foreground font-nunito text-sm">From your doorstep</p>
                            </Card>
                            <Card className="p-6 text-center shadow-card">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                                    <RotateCcw className="w-8 h-8" />
                                </div>
                                <h3 className="font-fredoka font-bold text-lg">Easy Exchange</h3>
                                <p className="text-muted-foreground font-nunito text-sm">Size not right? Swap it!</p>
                            </Card>
                        </div>

                        {/* Eligible Items */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-fredoka font-bold mb-6">What Can Be Returned?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6 border-green-200 bg-green-50">
                                    <h3 className="font-fredoka font-bold text-green-700 mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Eligible for Return
                                    </h3>
                                    <ul className="space-y-2 text-sm font-nunito text-green-700">
                                        <li>• Unused shoes in original condition</li>
                                        <li>• Wrong size received</li>
                                        <li>• Product different from description</li>
                                        <li>• Manufacturing defects</li>
                                        <li>• Damaged during shipping</li>
                                    </ul>
                                </Card>
                                <Card className="p-6 border-red-200 bg-red-50">
                                    <h3 className="font-fredoka font-bold text-red-700 mb-4 flex items-center gap-2">
                                        <XCircle className="w-5 h-5" />
                                        Not Eligible
                                    </h3>
                                    <ul className="space-y-2 text-sm font-nunito text-red-700">
                                        <li>• Used or worn shoes</li>
                                        <li>• Items without original packaging</li>
                                        <li>• Tags removed or damaged</li>
                                        <li>• Products marked as "Final Sale"</li>
                                        <li>• Items returned after 14 days</li>
                                    </ul>
                                </Card>
                            </div>
                        </div>

                        {/* How to Return */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-fredoka font-bold mb-6">How to Return</h2>
                            <div className="space-y-4">
                                {[
                                    { step: 1, title: 'Login to Your Account', desc: 'Go to "My Orders" and select the order you want to return' },
                                    { step: 2, title: 'Select Return/Exchange', desc: 'Click on "Return" or "Exchange" and choose your reason' },
                                    { step: 3, title: 'Schedule Pickup', desc: 'Choose a convenient date and time for pickup' },
                                    { step: 4, title: 'Pack the Product', desc: 'Pack the shoes in original packaging with all tags intact' },
                                    { step: 5, title: 'Hand Over', desc: 'Our delivery partner will collect from your doorstep' },
                                    { step: 6, title: 'Refund', desc: 'Refund will be processed within 5-7 business days after verification' },
                                ].map(item => (
                                    <div key={item.step} className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h3 className="font-fredoka font-bold">{item.title}</h3>
                                            <p className="text-muted-foreground font-nunito text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Refund Info */}
                        <Card className="p-6 mb-12 border-yellow-200 bg-yellow-50">
                            <h3 className="font-fredoka font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Refund Information
                            </h3>
                            <ul className="space-y-2 text-sm font-nunito text-yellow-800">
                                <li>• <strong>Online Payment:</strong> Refund to original payment method within 5-7 business days</li>
                                <li>• <strong>COD Orders:</strong> Refund via bank transfer (provide account details during return)</li>
                                <li>• <strong>Exchanges:</strong> No additional charges for size exchanges</li>
                            </ul>
                        </Card>

                        {/* CTA */}
                        <div className="p-8 bg-primary/5 rounded-2xl text-center">
                            <h3 className="text-xl font-fredoka font-bold mb-2">Need Help with Returns?</h3>
                            <p className="text-muted-foreground font-nunito mb-4">
                                Our support team is here to assist you
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

export default Returns;

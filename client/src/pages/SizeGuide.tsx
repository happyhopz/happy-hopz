import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Ruler, HelpCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const SizeGuide = () => {
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
                            <Ruler className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-foreground mb-4">
                            Kids Shoe <span className="text-primary">Size Guide</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-nunito max-w-2xl mx-auto">
                            Find the perfect fit for your little one's growing feet
                        </p>
                    </div>
                </section>

                {/* Size Guide Content */}
                <section className="py-10">
                    <div className="container mx-auto px-4 max-w-4xl">
                        {/* How to Measure */}
                        <Card className="p-6 mb-12 border-primary/20 bg-primary/5">
                            <h2 className="text-xl font-fredoka font-bold mb-4 flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-primary" />
                                How to Measure Your Child's Feet
                            </h2>
                            <ol className="space-y-3 font-nunito text-muted-foreground">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
                                    <span>Place a piece of paper on a flat floor against a wall</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">2</span>
                                    <span>Have your child stand on the paper with their heel against the wall</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">3</span>
                                    <span>Mark the longest toe and measure from the wall to the mark</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">4</span>
                                    <span>Measure both feet - if they differ, use the larger measurement</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">5</span>
                                    <span>Use the chart below to find the right size</span>
                                </li>
                            </ol>
                        </Card>

                        {/* Size Chart */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-fredoka font-bold mb-6">Kids Shoe Size Chart</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-primary text-white">
                                            <th className="px-3 py-3 text-left font-nunito font-bold">Our Size</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">Age</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">US Size</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">UK Size</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">EU Size</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">Inch</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">CM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-nunito">
                                        {[
                                            { ourSize: 'XS', age: '1-3 m', us: '1 C', uk: '0 C', eu: '16', inch: '3.5', cm: '8.9' },
                                            { ourSize: 'XS', age: '3-6 m', us: '2 C', uk: '1 C', eu: '17', inch: '3.75', cm: '9.5' },
                                            { ourSize: 'XS', age: '6-9 m', us: '3 C', uk: '2 C', eu: '18', inch: '4.125', cm: '10.5' },
                                            { ourSize: 'S', age: '10-12 m', us: '4 C', uk: '3 C', eu: '19', inch: '4.5', cm: '11.4' },
                                            { ourSize: 'S', age: '15-18 m', us: '5 C', uk: '4 C', eu: '20', inch: '4.75', cm: '12.1' },
                                            { ourSize: 'S', age: '1.5-2 y', us: '6 C', uk: '5 C', eu: '22', inch: '5.125', cm: '13' },
                                            { ourSize: 'M', age: '2-2.5 y', us: '7 C', uk: '6 C', eu: '23', inch: '5.5', cm: '14' },
                                            { ourSize: 'M', age: '2.5-3 y', us: '8 C', uk: '7 C', eu: '24', inch: '5.75', cm: '14.6' },
                                            { ourSize: 'M', age: '3-4 y', us: '9 C', uk: '8 C', eu: '25', inch: '6.125', cm: '15.6' },
                                            { ourSize: 'L', age: '4-4.5 y', us: '10 C', uk: '9 C', eu: '27', inch: '6.5', cm: '16.5' },
                                            { ourSize: 'L', age: '5 y', us: '11 C', uk: '10 C', eu: '28', inch: '6.75', cm: '17.1' },
                                            { ourSize: 'XL', age: '5-5.5 y', us: '12 C', uk: '11 C', eu: '30', inch: '7.125', cm: '18.1' },
                                            { ourSize: 'XL', age: '5.5-6 y', us: '13 C', uk: '12 C', eu: '31', inch: '7.5', cm: '19.1' },
                                            { ourSize: 'XXL', age: '7 y', us: '1 Y', uk: '13 C', eu: '32', inch: '7.75', cm: '19.7' },
                                            { ourSize: 'XXL', age: '8 y', us: '2 Y', uk: '1 Y', eu: '33', inch: '8.125', cm: '20.6' },
                                        ].map((row, idx) => (
                                            <tr key={`${row.ourSize}-${row.age}`} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-3 py-2.5 font-bold text-primary">{row.ourSize}</td>
                                                <td className="px-3 py-2.5 font-medium">{row.age}</td>
                                                <td className="px-3 py-2.5">{row.us}</td>
                                                <td className="px-3 py-2.5">{row.uk}</td>
                                                <td className="px-3 py-2.5">{row.eu}</td>
                                                <td className="px-3 py-2.5">{row.inch}</td>
                                                <td className="px-3 py-2.5">{row.cm}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                                <h3 className="font-bold text-sm mb-2">Quick Size Reference:</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-nunito">
                                    <span><strong className="text-primary">XS</strong> = 1-9 months</span>
                                    <span><strong className="text-primary">S</strong> = 10 months - 2 years</span>
                                    <span><strong className="text-primary">M</strong> = 2-4 years</span>
                                    <span><strong className="text-primary">L</strong> = 4-5 years</span>
                                    <span><strong className="text-primary">XL</strong> = 5-6 years</span>
                                    <span><strong className="text-primary">XXL</strong> = 7-8 years</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 font-nunito">
                                * Measurements are approximate. When in doubt, size up for growing feet.
                            </p>
                        </div>


                        {/* Wrong Size CTA */}
                        <div className="p-8 bg-primary/5 rounded-2xl text-center">
                            <h3 className="text-xl font-fredoka font-bold mb-2">Got the Wrong Size?</h3>
                            <p className="text-muted-foreground font-nunito mb-4">
                                Don't worry! We offer free size exchanges within 14 days
                            </p>
                            <a
                                href="/returns"
                                className="inline-block bg-primary text-white px-6 py-2 rounded-full font-nunito font-bold hover:bg-primary/90 transition-colors"
                            >
                                Learn About Exchanges
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default SizeGuide;

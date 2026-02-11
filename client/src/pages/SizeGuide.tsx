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
                                            <th className="px-3 py-3 text-left font-nunito font-bold">Age Group</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">EU Size</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">Inch</th>
                                            <th className="px-3 py-3 text-left font-nunito font-bold">CM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-nunito">
                                        {[
                                            { ourSize: 'XS', age: '0 - 9 Months', eu: '13 - 18', inch: '3.5" - 4.125"', cm: '8.9 - 10.5' },
                                            { ourSize: 'S', age: '10 Months - 2 Years', eu: '19 - 22', inch: '4.5" - 5.125"', cm: '11.4 - 13' },
                                            { ourSize: 'M', age: '2 - 4 Years', eu: '23 - 25', inch: '5.5" - 6.125"', cm: '14 - 15.6' },
                                            { ourSize: 'L', age: '4 - 5 Years', eu: '26 - 28', inch: '6.25" - 6.75"', cm: '15.9 - 17.1' },
                                            { ourSize: 'XL', age: '5 - 6 Years', eu: '29 - 31', inch: '6.8" - 7.5"', cm: '17.5 - 19.1' },
                                            { ourSize: 'XXL', age: '7 - 8 Years', eu: '32 - 33', inch: '7.75" - 8.125"', cm: '19.7 - 20.6' },
                                        ].map((row, idx) => (
                                            <tr key={row.ourSize} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white border-y border-gray-100'}>
                                                <td className="px-3 py-4 font-bold text-primary text-base">{row.ourSize}</td>
                                                <td className="px-3 py-4 font-medium">{row.age}</td>
                                                <td className="px-3 py-4 font-bold text-slate-700">{row.eu}</td>
                                                <td className="px-3 py-4 text-slate-500">{row.inch}</td>
                                                <td className="px-3 py-4 text-slate-500">{row.cm}</td>
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

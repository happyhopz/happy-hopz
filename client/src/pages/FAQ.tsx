import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const faqData = [
    {
        category: 'Orders & Payment',
        questions: [
            {
                q: 'How can I place an order?',
                a: 'Simply browse our collection, select your preferred shoes, choose the size and color, and click "Add to Bag". Once you\'re ready, proceed to checkout, enter your shipping details, and complete the payment.'
            },
            {
                q: 'What payment methods do you accept?',
                a: 'We accept Credit/Debit Cards (Visa, Mastercard, RuPay), UPI (GPay, PhonePe, Paytm), Net Banking from all major banks, and Cash on Delivery (COD) for most locations.'
            },
            {
                q: 'Can I cancel my order?',
                a: 'Orders can be cancelled before they are shipped. Once dispatched, you can refuse delivery or initiate a return after receiving the product.'
            },
            {
                q: 'How do I track my order?',
                a: 'You will receive a tracking link via email/SMS once your order is shipped. You can also track your order status in the "My Orders" section of your account.'
            }
        ]
    },
    {
        category: 'Shipping & Delivery',
        questions: [
            {
                q: 'What are the shipping charges?',
                a: 'We offer FREE shipping on all orders across India! No minimum purchase required.'
            },
            {
                q: 'How long does delivery take?',
                a: 'Standard delivery takes 3-7 business days depending on your location. Metro cities usually receive orders within 3-5 days.'
            },
            {
                q: 'Do you deliver to my area?',
                a: 'We deliver to most pincodes across India. Enter your pincode on the product page to check delivery availability and estimated time.'
            },
            {
                q: 'What if I\'m not available during delivery?',
                a: 'Our delivery partner will attempt delivery up to 3 times. You can also reschedule delivery by contacting them directly using the tracking link.'
            }
        ]
    },
    {
        category: 'Returns & Exchanges',
        questions: [
            {
                q: 'What is your return policy?',
                a: 'We offer a 14-day easy return policy. Products must be unused, in original packaging, and with all tags intact.'
            },
            {
                q: 'How do I return a product?',
                a: 'Go to "My Orders", select the order, and click "Return". Choose your reason and schedule a pickup. Our team will collect the product from your doorstep.'
            },
            {
                q: 'Can I exchange for a different size?',
                a: 'Yes! If the size doesn\'t fit, you can easily exchange for a different size. The exchange is free of charge.'
            },
            {
                q: 'When will I get my refund?',
                a: 'Refunds are processed within 5-7 business days after we receive and verify the returned product. The amount will be credited to your original payment method.'
            }
        ]
    },
    {
        category: 'Size & Fit',
        questions: [
            {
                q: 'How do I find the right size?',
                a: 'Use our Size Guide on each product page. Measure your child\'s foot length and compare it with our size chart. When in doubt, size up for growing feet!'
            },
            {
                q: 'What if the shoes don\'t fit?',
                a: 'No worries! We offer free size exchanges. Simply initiate a return and order the correct size, or exchange directly.'
            },
            {
                q: 'Do your shoes run true to size?',
                a: 'Yes, our shoes are true to size. However, we recommend checking the size guide as sizing may vary slightly between styles.'
            }
        ]
    },
    {
        category: 'Product & Quality',
        questions: [
            {
                q: 'Are Happy Hopz shoes comfortable?',
                a: 'Absolutely! All our shoes feature cushioned insoles, breathable materials, and flexible soles designed for children\'s active lifestyle.'
            },
            {
                q: 'Are the materials safe for children?',
                a: 'Yes! We use only child-safe, non-toxic materials. Our shoes are tested for harmful substances and designed for sensitive skin.'
            },
            {
                q: 'How should I clean the shoes?',
                a: 'Most of our shoes can be wiped clean with a damp cloth. For sneakers, use mild soap and air dry. Avoid machine washing unless specified.'
            }
        ]
    }
];

const FAQ = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredFAQ = faqData.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

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
                        <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-foreground mb-4">
                            Frequently Asked <span className="text-primary">Questions</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-nunito max-w-2xl mx-auto mb-8">
                            Find quick answers to common questions about orders, shipping, and more.
                        </p>

                        {/* Search */}
                        <div className="max-w-md mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Search for answers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 text-base"
                            />
                        </div>
                    </div>
                </section>

                {/* FAQ Content */}
                <section className="py-10">
                    <div className="container mx-auto px-4 max-w-4xl">
                        {filteredFAQ.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground font-nunito">
                                    No results found for "{searchQuery}". Try a different search term.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {filteredFAQ.map((category) => (
                                    <div key={category.category}>
                                        <h2 className="text-2xl font-fredoka font-bold mb-4 text-primary">
                                            {category.category}
                                        </h2>
                                        <div className="space-y-3">
                                            {category.questions.map((item, idx) => {
                                                const itemId = `${category.category}-${idx}`;
                                                const isOpen = openItems.includes(itemId);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="border rounded-xl overflow-hidden bg-card"
                                                    >
                                                        <button
                                                            onClick={() => toggleItem(itemId)}
                                                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                                                        >
                                                            <span className="font-nunito font-bold text-foreground pr-4">
                                                                {item.q}
                                                            </span>
                                                            <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {isOpen && (
                                                            <div className="px-6 pb-4">
                                                                <p className="text-muted-foreground font-nunito leading-relaxed">
                                                                    {item.a}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Contact CTA */}
                        <div className="mt-12 p-8 bg-primary/5 rounded-2xl text-center">
                            <h3 className="text-xl font-fredoka font-bold mb-2">
                                Still have questions?
                            </h3>
                            <p className="text-muted-foreground font-nunito mb-4">
                                Can't find what you're looking for? We're here to help!
                            </p>
                            <a
                                href="/contact"
                                className="inline-block bg-primary text-white px-6 py-2 rounded-full font-nunito font-bold hover:bg-primary/90 transition-colors"
                            >
                                Contact Us
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default FAQ;

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Mail, Phone, MapPin, Instagram, Facebook, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Message sent! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSending(false);
    };

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
                        <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-foreground mb-4">
                            Get in <span className="text-primary">Touch</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-nunito max-w-2xl mx-auto">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>
                </section>

                {/* Contact Content */}
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                            {/* Contact Form */}
                            <Card className="p-8 shadow-card">
                                <h2 className="text-2xl font-fredoka font-bold mb-6">Send us a Message</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="font-nunito font-bold">Your Name *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="font-nunito font-bold">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john@example.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="font-nunito font-bold">Subject *</Label>
                                        <Input
                                            id="subject"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="How can we help you?"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message" className="font-nunito font-bold">Message *</Label>
                                        <textarea
                                            id="message"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Tell us more about your query..."
                                            rows={5}
                                            required
                                            className="w-full px-3 py-2 border border-input rounded-md bg-background font-nunito resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="hopz"
                                        className="w-full"
                                        disabled={sending}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {sending ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </form>
                            </Card>

                            {/* Contact Info */}
                            <div className="space-y-6">
                                <Card className="p-6 shadow-card">
                                    <h3 className="text-xl font-fredoka font-bold mb-4">Contact Information</h3>
                                    <div className="space-y-4">
                                        <ContactItem
                                            icon={<Mail className="w-5 h-5" />}
                                            label="Email"
                                            value="happyhopz308@gmail.com"
                                            href="mailto:happyhopz308@gmail.com?subject=Enquiry from Happy Hopz Website"
                                        />
                                        <ContactItem
                                            icon={<Phone className="w-5 h-5" />}
                                            label="Phone"
                                            value="+91 97118 64674"
                                            href="tel:+919711864674"
                                        />
                                        <ContactItem
                                            icon={<MapPin className="w-5 h-5" />}
                                            label="Location"
                                            value="India"
                                        />
                                        <ContactItem
                                            icon={<Clock className="w-5 h-5" />}
                                            label="Response Time"
                                            value="Within 24-48 hours"
                                        />
                                    </div>
                                </Card>

                                <Card className="p-6 shadow-card">
                                    <h3 className="text-xl font-fredoka font-bold mb-4">Follow Us</h3>
                                    <p className="text-muted-foreground font-nunito text-sm mb-4">
                                        Stay connected for latest updates, new arrivals, and exclusive offers!
                                    </p>
                                    <div className="flex gap-4">
                                        <a
                                            href="https://www.instagram.com/happyhopzz?igsh=czMyaW1zYTY5ZWtz"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            <Instagram className="w-5 h-5" />
                                            <span className="font-nunito font-bold">Instagram</span>
                                        </a>
                                        <a
                                            href="https://www.facebook.com/share/18Hz57kKZa/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Facebook className="w-5 h-5" />
                                            <span className="font-nunito font-bold">Facebook</span>
                                        </a>
                                    </div>
                                </Card>

                                <Card className="p-6 shadow-card bg-primary/5 border-primary/20">
                                    <h3 className="text-xl font-fredoka font-bold mb-2">Need Help?</h3>
                                    <p className="text-muted-foreground font-nunito text-sm mb-4">
                                        Check out our FAQ section for quick answers to common questions about orders, shipping, and returns.
                                    </p>
                                    <a
                                        href="/faq"
                                        className="text-primary font-nunito font-bold hover:underline"
                                    >
                                        Visit FAQ →
                                    </a>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

const ContactItem = ({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) => (
    <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm text-muted-foreground font-nunito">{label}</p>
            {href ? (
                <a href={href} className="font-fredoka font-bold text-foreground hover:text-primary transition-colors">
                    {value}
                </a>
            ) : (
                <p className="font-fredoka font-bold text-foreground">{value}</p>
            )}
        </div>
    </div>
);

export default Contact;

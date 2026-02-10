import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Heart, Star, Shield, Truck, Award, Users } from 'lucide-react';
import pandaLogo from '@/assets/happy-hopz-logo.png';

const About = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-4">
                {/* Back Button */}
                <div className="container mx-auto px-4 mb-4">
                    <BackButton />
                </div>

                {/* Hero Section */}
                <section className="bg-gradient-to-br from-pink-50 via-cyan-50 to-purple-50 py-10">
                    <div className="container mx-auto px-4 text-center">
                        <img
                            src={pandaLogo}
                            alt="Happy Hopz"
                            className="w-48 h-48 md:w-56 md:h-56 mx-auto mb-6 animate-bounce-gentle object-contain"
                        />
                        <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-foreground mb-4">
                            About <span className="text-primary">Happy Hopz</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-nunito max-w-2xl mx-auto">
                            Where Every Step Is a Happy Hopz – Growing With Your Little Ones 🐼
                        </p>
                    </div>
                </section>

                {/* Our Story */}
                <section className="py-10">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl font-fredoka font-bold text-center mb-8">Our Story</h2>
                            <div className="prose prose-lg mx-auto text-muted-foreground font-nunito">
                                <p className="mb-6">
                                    Happy Hopz was born from a simple observation: kids need shoes that can keep up with their endless energy,
                                    curiosity, and adventures. As parents ourselves, we understand the importance of finding footwear that's
                                    not just comfortable, but also stylish enough to make your little ones smile.
                                </p>
                                <p className="mb-6">
                                    Founded in India, we've made it our mission to provide high-quality, affordable footwear that supports
                                    healthy foot development while letting kids express their unique personalities. Every pair of Happy Hopz
                                    shoes is designed with love, tested by kids, and approved by parents.
                                </p>
                                <p>
                                    From their first steps to their school days and beyond, Happy Hopz is here to make every step
                                    a happy one. Because when little feet are happy, the whole family is happy! 🎉
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="py-10 bg-secondary/30">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-fredoka font-bold text-center mb-12">Why Choose Happy Hopz?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <ValueCard
                                icon={<Heart className="w-8 h-8" />}
                                title="Made with Love"
                                description="Every pair is crafted with care, keeping your child's comfort as our top priority."
                            />
                            <ValueCard
                                icon={<Shield className="w-8 h-8" />}
                                title="Safe Materials"
                                description="We use only child-safe, non-toxic materials that are gentle on sensitive skin."
                            />
                            <ValueCard
                                icon={<Star className="w-8 h-8" />}
                                title="Premium Quality"
                                description="Durable construction that withstands the rough and tumble of childhood play."
                            />
                            <ValueCard
                                icon={<Truck className="w-8 h-8" />}
                                title="Free Shipping"
                                description="Enjoy free delivery across India on orders above ₹999."
                            />
                            <ValueCard
                                icon={<Award className="w-8 h-8" />}
                                title="100% Original"
                                description="All products are genuine Happy Hopz originals with quality guarantee."
                            />
                            <ValueCard
                                icon={<Users className="w-8 h-8" />}
                                title="Happy Parents"
                                description="Thousands of parents trust Happy Hopz for their children's footwear needs."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-10 bg-primary text-white text-center">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-fredoka font-bold mb-4">
                            Ready to Find the Perfect Pair?
                        </h2>
                        <p className="text-lg opacity-90 font-nunito mb-8 max-w-xl mx-auto">
                            Explore our collection of comfortable, stylish shoes designed just for kids.
                        </p>
                        <a
                            href="/products"
                            className="inline-block bg-white text-primary px-8 py-3 rounded-full font-fredoka font-bold hover:bg-gray-100 transition-colors"
                        >
                            Shop Now
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

const ValueCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-float transition-all text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            {icon}
        </div>
        <h3 className="font-fredoka font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground font-nunito text-sm">{description}</p>
    </div>
);

export default About;

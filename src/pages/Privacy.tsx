import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="w-full z-50 border-b border-primary/10 bg-white/50 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT Logo" className="h-10 w-auto" />
          </div>
          <a href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
          
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p>
                YFIT AI ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
              <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Personal Data:</strong> Name, email address, phone number, age, height, weight, gender, and fitness goals.</li>
                <li><strong>Health Data:</strong> Body measurements, workout history, nutrition logs, medication information, and progress photos.</li>
                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on pages, links clicked, and other interactions with our Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Age Restrictions</h2>
              <p>
                YFIT AI is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information and terminate the child's account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Use of Your Information</h2>
              <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Provide, operate, and maintain our Service</li>
                <li>Improve, personalize, and expand our Service</li>
                <li>Understand and analyze how you use our Service</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Communicate with you, including for customer service and support</li>
                <li>Process your transactions and send related information</li>
                <li>Generate personalized fitness recommendations and AI coaching</li>
                <li>Create provider reports for your healthcare professionals</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Disclosure of Your Information</h2>
              <p>We may share information we have collected about you in certain situations:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>By Law or to Protect Rights:</strong> If required by law or if we believe in good faith that disclosure is necessary to protect your rights, our rights, or the rights of others.</li>
                <li><strong>Third-Party Service Providers:</strong> We may share your information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
                <li><strong>Business Transfers:</strong> If YFIT AI is involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Security of Your Information</h2>
              <p>
                We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Data Retention</h2>
              <p>
                We will retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Your Rights and Data Deletion</h2>
              <p>
                You have the right to request deletion of your account and all associated personal data. To request account and data deletion, please <a href="/contact" className="text-primary hover:underline">contact us</a>. We will process your request within 30 days.
              </p>
              <p className="mt-3">
                Upon deletion, we will remove the following data:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Personal identification information</li>
                <li>Health and fitness data</li>
                <li>Workout history and nutrition logs</li>
                <li>Progress photos and measurements</li>
                <li>Medication tracking information</li>
                <li>Account preferences and settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Us</h2>
              <p>
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-3">
                <strong>Email:</strong> <a href="/contact" className="text-primary hover:underline">Contact Us</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date above.
              </p>
            </section>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> December 31, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

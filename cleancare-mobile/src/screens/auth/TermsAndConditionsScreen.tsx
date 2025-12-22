import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../styles/theme';

export const TermsAndConditionsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>শর্তাবলী এবং গোপনীয়তা নীতি</Text>
        
        <Text style={styles.paragraph}>
          নতুন অ্যাকাউন্ট তৈরি করার সময় ব্যবহারকারী এই শর্তগুলো মেনে টিক চিহ্ন দিয়ে তাদের অ্যাকাউন্ট তৈরি করবেন।
          ব্যবহারকারী হিসেবে আপনার অ্যাকাউন্ট তৈরি করার অর্থ হলো, আপনি এই শর্তাবলী সম্পূর্ণ রূপে পড়েছেন এবং এতে সম্মত।
        </Text>

        <Text style={styles.sectionTitle}>১. সঠিক তথ্যের বাধ্যবাধকতা</Text>
        <Text style={styles.paragraph}>
          ১.১ তথ্য সত্যতা: আপনি অঙ্গীকার করছেন যে, সাইন আপ ফর্মে দেওয়া আপনার নাম, মোবাইল নম্বর এবং পূর্ণাঙ্গ ঠিকানা সম্পূর্ণ রূপে সঠিক ও নির্ভুল।
        </Text>
        <Text style={styles.paragraph}>
          ১.২ যোগাযোগের উদ্দেশ্য: আপনি সম্মতি দিচ্ছেন যে, আপনার দেওয়া মোবাইল নম্বরটি অভিযোগের যাচাইকরণ, সমাধান এবং জরুরি যোগাযোগের জন্য কর্তৃপক্ষ ব্যবহার করতে পারবে।
        </Text>
        <Text style={styles.paragraph}>
          ১.৩ অ্যাকাউন্ট বাতিল: ভুল, ভুয়া, বা বিভ্রান্তিকর তথ্য দিয়ে অ্যাকাউন্ট তৈরি করার প্রমাণ পাওয়া গেলে কর্তৃপক্ষ নোটিশ ছাড়াই আপনার অ্যাকাউন্ট স্থগিত বা বাতিল করার অধিকার রাখে।
        </Text>

        <Text style={styles.sectionTitle}>২. অ্যাপ ব্যবহারের উদ্দেশ্য ও সীমাবদ্ধতা</Text>
        <Text style={styles.paragraph}>
          ২.১ সুনির্দিষ্ট ব্যবহার: এই অ্যাপটি শুধুমাত্র ঢাকা সিটি কর্পোরেশন এলাকায় বর্জ্য ব্যবস্থাপনা ও পরিচ্ছন্নতা সংক্রান্ত অভিযোগ জমা নেওয়া এবং এর স্থিতি ট্র্যাক করার উদ্দেশ্যে ব্যবহৃত হবে।
        </Text>
        <Text style={styles.paragraph}>
          ২.২ অবৈধ ব্যবহার: আপনি এই প্ল্যাটফর্মটি ব্যবহার করে কোনো ধরনের অশালীন, হয়রানিমূলক, অপরাধমূলক বা অবৈধ কার্যকলাপ করবেন না।
        </Text>
        <Text style={styles.paragraph}>
          ২.৩ ছবি ও বিষয়বস্তু: অভিযোগের সাথে জমা দেওয়া ছবি, ভিডিও বা টেক্সট অবশ্যই অভিযোগের সাথে সরাসরি প্রাসঙ্গিক হতে হবে। আপত্তিকর, ব্যক্তিগত বা তৃতীয় পক্ষের কপিরাইট লঙ্ঘন করে এমন কোনো বিষয়বস্তু আপলোড করা কঠোরভাবে নিষিদ্ধ।
        </Text>
        <Text style={styles.paragraph}>
          ২.৪ লাইসেন্স: আপনি অ্যাপে আপলোড করা যেকোনো ছবি বা তথ্যের স্বত্ব ধরে রাখলেও, কর্তৃপক্ষকে সেই ছবি অভিযোগের সমাধান, নীতি বিশ্লেষণ, গবেষণা এবং প্রচারণার জন্য ব্যবহার করার অনুমতি দিচ্ছেন।
        </Text>

        <Text style={styles.sectionTitle}>৩. তথ্য নিরাপত্তা ও গোপনীয়তা</Text>
        <Text style={styles.paragraph}>
          ৩.১ ডেটা সংগ্রহ: আপনি সম্মত যে অভিযোগ জমা নেওয়ার সময় আপনার GPS লোকেশন, যোগাযোগের তথ্য এবং ডিভাইস ডেটা সংগ্রহ করা হবে। এই ডেটা শুধুমাত্র অভিযোগ নিষ্পত্তির উদ্দেশ্যে, গোপনীয়তা নীতি মেনে, ব্যবহার করা হবে।
        </Text>
        <Text style={styles.paragraph}>
          ৩.২ তথ্যের ব্যবহার: আপনার ব্যক্তিগত তথ্য বাণিজ্যিকভাবে বিক্রি বা শেয়ার করা হবে না। তবে, আইনগত বাধ্যবাধকতা, গবেষণা বা সরকারি আদেশ পালনের জন্য তথ্য ব্যবহার করা হতে পারে।
        </Text>

        <Text style={styles.sectionTitle}>৪. পরিষেবার ও দায়বদ্ধতার সীমাবদ্ধতা</Text>
        <Text style={styles.paragraph}>
          ৪.১ সমাধান: কর্তৃপক্ষ অভিযোগের দ্রুত সমাধান নিশ্চিত করতে বদ্ধপরিকর। তবে, প্রাকৃতিক দুর্যোগ, অপ্রত্যাশিত ঘটনা বা জরুরি অবস্থার কারণে অভিযোগ নিষ্পত্তির সময়সীমা পরিবর্তিত হতে পারে।
        </Text>
        <Text style={styles.paragraph}>
          ৪.২ দায়বদ্ধতা: অ্যাপটির ব্যবহার বা এর পরিষেবার কারণে সৃষ্ট কোনো প্রত্যক্ষ বা পরোক্ষ ক্ষতির জন্য ঢাকা সিটি কর্পোরেশন বা অ্যাপ কর্তৃপক্ষ দায়ী থাকবে না।
        </Text>
        
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                গ্রাহক তার দেওয়া তথ্যের সত্যতা এবং অ্যাপটি শুধুমাত্র বর্জ্য ব্যবস্থাপনা সংক্রান্ত কাজে ব্যবহারের অঙ্গীকার করবেন। কোনো ধরনের অবৈধ কার্যকলাপের দায়ভার সম্পূর্ণ রূপে গ্রাহকের উপর বর্তাবে। গ্রাহকের তথ্য সেবাদান ও আইনগত প্রয়োজনে ব্যবহার হতে পারে। উপরের বিষয়াদি জেনেশুনে সজ্ঞানে কারো প্ররোচনা ছাড়া —এই শর্তে সম্মতি দিয়ে টিক চিহ্ন দিতে হবে।
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'justify',
  },
  footer: {
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#eee',
  },
  footerText: {
      fontSize: 14,
      color: '#666',
      fontStyle: 'italic',
      textAlign: 'center',
  }
});

const fs = require('fs');

const arFile = 'src/i18n/messages/ar.json';
let data = JSON.parse(fs.readFileSync(arFile, 'utf8'));

// Auth
data.auth.register.codeMustBe6Digits = "يجب أن يكون الرمز 6 أرقام";
data.auth.register.chooseLanguageLocation = "اختر لغتك وموقعك للبدء";
data.auth.register.howToUse = "كيف تريد استخدام سيرفكس؟";
data.auth.register.enterPersonalInfo = "أدخل معلوماتك الشخصية";
data.auth.register.tellClientsAboutSkills = "أخبر العملاء عن مهاراتك";
data.auth.sessionExpired = "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى";

// Profile
data.profile.failedToSendRequest = "فشل إرسال الطلب";
data.profile.moreOptions = "خيارات إضافية";
data.profile.availableNow = "متاح الآن";
data.profile.priceTitle = "السعر";
data.profile.perRequest = "لكل طلب";
data.profile.aboutMe = "نبذة عني";
data.profile.bookNow = "احجز الآن";
data.profile.customerReviews = "تقييمات العملاء";
data.profile.professionTitle = "المهنة";
data.profile.specializationTitle = "التخصص";
data.profile.locationTitle = "الموقع";
data.profile.noReviewsYet = "لا توجد تقييمات لهذا المحترف بعد";
data.profile.requestModalSubtitle = "صف ما تحتاجه من المحترف بالتفصيل";
data.profile.changesSaved = "تم حفظ التغييرات بنجاح";
data.profile.saveError = "خطأ في الحفظ";
data.profile.repositionCover = "إعادة تعيين الغلاف";
data.profile.changeCoverPhoto = "تغيير صورة الغلاف";
data.profile.uploadCoverPhoto = "رفع صورة الغلاف";
data.profile.dragToReposition = "اسحب لتغيير الموضع";
data.profile.changeProfilePhoto = "تغيير الصورة الشخصية";
data.profile.uploadProfilePhoto = "رفع الصورة الشخصية";
data.profile.premium = "مميز";
data.profile.state = "المنطقة / المحافظة";

// Requests
data.requests.reviewService = "تقييم الخدمة";
data.requests.notificationAcceptedTitle = "تم قبول طلبك";
data.requests.notificationAcceptedBody = "وافق {name} على طلب الحجز الخاص بك";
data.requests.notificationRejectedTitle = "تم رفض طلبك";
data.requests.notificationRejectedBody = "عذراً، رفض {name} طلب الحجز الخاص بك";

fs.writeFileSync(arFile, JSON.stringify(data, null, 2));
console.log("Arabic translation updated successfully.");

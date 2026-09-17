/* ── Movie Physics scenes ──────────────────────────────────────────────────────
   One famous movie clip per physics topic. Every text field is { en, ta } so the
   module follows the app's language toggle. `youtubeId` is the part after
   youtu.be/ in the share link. */
const MOVIE_SCENES = [
  {
    id: "torque",
    youtubeId: "LKhC7K55Tc0",
    accent: "amber",
    topic: { en: "Torque / Moment of Force", ta: "திருப்பு விசை / விசையின் திருப்புத்திறன்" },
    movie: { en: "The Avengers (2012)", ta: "தி அவெஞ்சர்ஸ் (2012)" },
    scene: {
      en: "Iron Man restarts the Helicarrier's turbine",
      ta: "அயர்ன் மேன் ஹெலிகேரியரின் டர்பைனை மீண்டும் சுழல வைக்கிறார்",
    },
    formula: "τ = F × d",
    story: {
      en: "One big fan (turbine) of the flying ship is broken. It stops turning, and the ship starts to fall. Iron Man flies inside. He pushes the fan blades with his suit until the heavy fan turns again.",
      ta: "ஹெலிகேரியரின் ஒரு பெரிய டர்பைன் சேதமடைந்து சுழல்வது நின்றுவிடுகிறது; கப்பல் கீழே விழத் தொடங்குகிறது. அயர்ன் மேன் சுழலிக்குள் பறந்து சென்று, தன் உடையின் உந்துவிசைக் கருவிகளால் இறக்கைகளைத் தள்ளி, கனமான டர்பைனை மீண்டும் சுழல வைக்கிறார்.",
    },
    physics: {
      en: [
        "The fan turns around a fixed centre rod. This rod is the pivot.",
        "Iron Man pushes at a distance from the centre. So the push turns the blades. This turning effect is torque (τ = F × d).",
        "A push near the end of a blade (big d) gives more torque than the same push near the centre.",
        "A big, heavy fan is hard to turn. So he keeps pushing until it turns fast.",
      ],
      ta: [
        "டர்பைன் ஒரு நிலையான அச்சைச் சுற்றிச் சுழல்கிறது — அந்த அச்சே சுழல் புள்ளி.",
        "அயர்ன் மேனின் தள்ளுதல் அச்சிலிருந்து ஒரு தொலைவில் செயல்படுவதால்தான் இறக்கைகள் சுழல்கின்றன. அந்தத் திருப்பு விளைவே திருப்பு விசை (τ = F × d).",
        "அதே விசையை இறக்கையின் வெளிமுனையில் (அதிக d) செலுத்தினால், மையத்துக்கு அருகில் தள்ளுவதைவிட மிக அதிக திருப்பு விசை கிடைக்கும்.",
        "பெரிய, கனமான டர்பைன் சுழல்வதை எதிர்க்கிறது; எனவே வேகம் பெறும் வரை அவர் தொடர்ந்து திருப்பு விசை செலுத்த வேண்டியுள்ளது.",
      ],
    },
    realLife: {
      en: "A door handle is far from the hinges. A long spanner opens a tight bolt easily. Both use a big distance (d) to get more torque.",
      ta: "கதவின் கைப்பிடி கீல்களிலிருந்து தொலைவில் வைக்கப்படுகிறது; நீளமான ஸ்பானர் இறுகிய போல்ட்டை எளிதாகத் திறக்கிறது — இரண்டும் அதிக தொலைவு (d) மூலம் அதிக திருப்பு விசை பெறுகின்றன.",
    },
    question: {
      en: "Why is it harder to turn the fan if Iron Man pushes very close to the centre?",
      ta: "அயர்ன் மேன் அச்சுக்கு மிக அருகில் தள்ளியிருந்தால் டர்பைனைச் சுழற்றுவது ஏன் கடினமாக இருந்திருக்கும்?",
    },
  },
  {
    id: "newtons-second-law",
    youtubeId: "_EyPuLNdh80",
    accent: "blue",
    topic: { en: "Newton's Second Law of Motion", ta: "நியூட்டனின் இரண்டாம் இயக்க விதி" },
    movie: { en: "Cars (2006)", ta: "கார்ஸ் (2006)" },
    scene: {
      en: "Lightning McQueen pushes The King to the finish line",
      ta: "லைட்னிங் மெக்குயின் தி கிங்கை இறுதிக் கோட்டுக்குத் தள்ளுகிறார்",
    },
    formula: "F = ma",
    story: {
      en: "In the last race, The King has a bad crash. He cannot move by himself. Lightning McQueen stops before the finish line. He goes back and pushes The King across the line. Now The King can finish his last race.",
      ta: "இறுதிப் பந்தயத்தில் தி கிங் மோசமாக விபத்துக்குள்ளாகி தானாக நகர முடியாமல் போகிறார். லைட்னிங் மெக்குயின் இறுதிக் கோட்டுக்குச் சற்று முன் நின்று, திரும்பிச் சென்று, தி கிங் தன் கடைசிப் பந்தயத்தை முடிக்கும்படி அவரைக் கோடு வரை தள்ளிச் செல்கிறார்.",
    },
    physics: {
      en: [
        "The King's engine gives no force. So he does not move until something pushes him.",
        "McQueen's push is that force. It makes The King speed up in the direction of the push (F = ma).",
        "The King is a big, heavy car (big m). So the push gives him only a small acceleration. That is why he moves slowly.",
        "To make him go faster, McQueen must push harder. Double the force gives double the acceleration.",
      ],
      ta: [
        "தி கிங்கின் இயந்திரம் விசை தராததால், புற விசை செயல்படும் வரை அவர் அசையாமல் இருக்கிறார்.",
        "மெக்குயினின் தள்ளுதலே அந்த விசை. அது தி கிங்கைத் தள்ளும் திசையில் முடுக்குகிறது (F = ma).",
        "தி கிங் பெரிய, கனமான கார் (அதிக m); எனவே அதே தள்ளுதல் அவருக்குச் சிறிய முடுக்கத்தையே தருகிறது — அதனால்தான் அவர் மெதுவாக நகர்கிறார்.",
        "அவரை வேகப்படுத்த மெக்குயின் இன்னும் அதிகமாகத் தள்ள வேண்டும்: விசை இருமடங்கானால் முடுக்கமும் இருமடங்காகும்.",
      ],
    },
    realLife: {
      en: "An empty shopping trolley is easy to push. A full trolley speeds up slowly with the same push. More mass means less acceleration.",
      ta: "காலியான தள்ளுவண்டியைத் தள்ளுவது எளிது; ஆனால் நிரம்பிய வண்டி அதே தள்ளுதலில் மிக மெதுவாக வேகமெடுக்கும் — நிறை அதிகமானால் முடுக்கம் குறையும்.",
    },
    question: {
      en: "If McQueen pushes a small car with the same force, will it speed up more or less than The King? Why?",
      ta: "மெக்குயின் அதே விசையுடன் ஒரு சிறிய காரைத் தள்ளினால், அது தி கிங்கைவிட அதிகமாக முடுக்கம் பெறுமா, குறைவாகவா? ஏன்?",
    },
  },
  {
    id: "universal-law-of-gravitation",
    youtubeId: "MK51TWvm3VQ",
    accent: "violet",
    topic: { en: "Universal Law of Gravitation", ta: "பொது ஈர்ப்பியல் விதி" },
    movie: { en: "Green Lantern (2011)", ta: "கிரீன் லான்டர்ன் (2011)" },
    scene: {
      en: "Hal Jordan pulls Parallax into the Sun's gravity",
      ta: "ஹால் ஜோர்டன் பாராலாக்ஸை சூரியனின் ஈர்ப்புக்குள் இழுத்துச் செல்கிறார்",
    },
    formula: "F = G·m₁·m₂ / r²",
    story: {
      en: "Hal Jordan cannot beat the big monster Parallax in a fight. So he flies towards the Sun, and Parallax follows him. Near the Sun, Hal quickly turns away. But Parallax is caught by the Sun's very strong gravity and is pulled in.",
      ta: "சண்டையிட்டு ராட்சத அரக்கன் பாராலாக்ஸை வெல்ல முடியாததால், ஹால் ஜோர்டன் சூரியனை நோக்கிப் பறந்து, பாராலாக்ஸைத் தன்னைப் பின்தொடரச் செய்கிறார். சூரியனுக்கு அருகில் ஹால் கடைசி நொடியில் விலகிவிடுகிறார்; ஆனால் பாராலாக்ஸ் சூரியனின் மிகப் பெரிய ஈர்ப்பில் சிக்கி உள்ளே இழுக்கப்படுகிறது.",
    },
    physics: {
      en: [
        "Every object with mass pulls every other object. The Sun pulls both Hal and Parallax.",
        "The Sun has a very big mass (about 333,000 times the Earth). So its pull is very strong.",
        "Force depends on 1/r². When they come closer, r gets smaller and the pull grows very fast. Half the distance means four times the force.",
        "Parallax is very big (big m), so the pull on it is even stronger. When it comes too close, it cannot get away and falls in.",
      ],
      ta: [
        "நிறை கொண்ட ஒவ்வொரு பொருளும் மற்ற ஒவ்வொரு பொருளையும் ஈர்க்கிறது — சூரியன் ஹாலையும் பாராலாக்ஸையும் ஈர்க்கிறது.",
        "சூரியனின் நிறை மிகப் பெரியது (பூமியைவிட சுமார் 3,33,000 மடங்கு); எனவே அதன் ஈர்ப்பு விசை மிக அதிகம்.",
        "விசை 1/r²-ஐப் பொறுத்தது: அவர்கள் நெருங்கி, தொலைவு r குறையும்போது ஈர்ப்பு மிக வேகமாக அதிகரிக்கிறது. தொலைவு பாதியானால் விசை நான்கு மடங்காகும்.",
        "பாராலாக்ஸ் மிகப் பெரியது (அதிக m); எனவே அதன் மீதான விசை இன்னும் அதிகம். மிக அருகில் சென்றபின் அது தப்ப முடியாமல் உள்ளே விழுகிறது.",
      ],
    },
    realLife: {
      en: "The Moon's gravity pulls the sea water and makes tides. The Sun's gravity keeps all the planets moving around it.",
      ta: "சந்திரனின் ஈர்ப்பு பூமியின் கடல்களை இழுத்து ஓதங்களை (அலை ஏற்ற இறக்கம்) உண்டாக்குகிறது; சூரியனின் ஈர்ப்பு எல்லாக் கோள்களையும் அவற்றின் சுற்றுப்பாதையில் வைத்திருக்கிறது.",
    },
    question: {
      en: "If Parallax stayed two times farther from the Sun, how would the pull on it change?",
      ta: "பாராலாக்ஸ் சூரியனிலிருந்து இருமடங்கு தொலைவில் இருந்திருந்தால், அதன் மீதான ஈர்ப்பு விசை எப்படி மாறியிருக்கும்?",
    },
  },
  {
    id: "impulse",
    youtubeId: "w0tGz28n28s",
    accent: "rose",
    topic: { en: "Impulse", ta: "கணத்தாக்கு" },
    movie: { en: "Avengers: Endgame (2019)", ta: "அவெஞ்சர்ஸ்: எண்ட்கேம் (2019)" },
    scene: {
      en: "Captain America catches Thor's hammer",
      ta: "கேப்டன் அமெரிக்கா தோரின் சுத்தியலைப் பிடிக்கிறார்",
    },
    formula: "J = F × t = Δp",
    story: {
      en: "In the last battle, Thor's hammer flies very fast to Captain America. He does not stop it at once. He catches it and lets his arm move back with it. So the hammer stops slowly.",
      ta: "இறுதிப் போரில் மியோல்னிர் சுத்தியல் அதிவேகத்தில் கேப்டன் அமெரிக்காவை நோக்கிப் பறந்து வருகிறது. அதை ஒரே நொடியில் நிறுத்தாமல், அவர் சுத்தியலைப் பிடித்து, தன் கையை அதனுடன் பின்னோக்கி நகர விட்டு, படிப்படியாக நிறுத்துகிறார்.",
    },
    physics: {
      en: [
        "The flying hammer has a lot of momentum (p = mv). To stop it, the momentum must become zero (Δp).",
        "Impulse is force × time: J = F × t = Δp.",
        "The change in momentum stays the same. So if the stopping time t is longer, the force F on his hand is smaller.",
        "When Cap moves his arm back, t becomes bigger and the force becomes smaller. If he stopped it at once, the force would be very big.",
      ],
      ta: [
        "பறந்து வரும் சுத்தியலுக்கு அதிக உந்தம் (p = mv) உள்ளது. அதை நிறுத்த, அந்த உந்தம் பூஜ்ஜியமாக மாற வேண்டும் (Δp).",
        "கணத்தாக்கு என்பது விசையும் அது செயல்படும் நேரமும் பெருக்கியது: J = F × t = Δp.",
        "உந்த மாற்றம் மாறாது; எனவே நிறுத்தும் நேரம் t அதிகமானால், அவர் கையின் மீதான விசை F குறையும்.",
        "சுத்தியலுடன் கையைப் பின்னோக்கி இழுப்பதால் கேப் t-ஐ அதிகரித்து, தாக்கு விசையைக் குறைக்கிறார் — உடனே நிறுத்தியிருந்தால் மிகப் பெரிய விசை அவரைத் தாக்கியிருக்கும்.",
      ],
    },
    realLife: {
      en: "A cricket player moves their hands back when catching a fast ball. Car airbags make the stopping time longer. Both make the force smaller.",
      ta: "கிரிக்கெட் வீரர் வேகமான பந்தைப் பிடிக்கும்போது கைகளைப் பின்னோக்கி இழுக்கிறார்; காரின் காற்றுப்பைகள் நிற்கும் நேரத்தை அதிகரிக்கின்றன — இரண்டும் தாக்கு விசையைக் குறைக்கின்றன.",
    },
    question: {
      en: "What happens to the force on Cap's hand if he stops the hammer in half the time?",
      ta: "கேப் சுத்தியலைப் பாதி நேரத்தில் நிறுத்தியிருந்தால், அவர் கையின் மீதான விசைக்கு என்ன நேர்ந்திருக்கும்?",
    },
  },
  {
    id: "conservation-of-momentum",
    youtubeId: "2AZDfKnIVKg",
    accent: "emerald",
    topic: { en: "Conservation of Linear Momentum", ta: "நேர்க்கோட்டு உந்த அழிவின்மை விதி" },
    movie: { en: "Avengers: Age of Ultron (2015)", ta: "அவெஞ்சர்ஸ்: ஏஜ் ஆஃப் அல்ட்ரான் (2015)" },
    scene: {
      en: "Hulk hits the Hulkbuster with a lamp post",
      ta: "ஹல்க் ஒரு விளக்குக் கம்பத்தால் ஹல்க்பஸ்டரைத் தாக்குகிறார்",
    },
    formula: "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂",
    story: {
      en: "In their street fight, Hulk pulls out a metal lamp post. He swings it hard at Iron Man's Hulkbuster suit. The fast pole hits the Hulkbuster, and the big suit flies backwards.",
      ta: "தெருச் சண்டையின்போது ஹல்க் ஒரு உலோக விளக்குக் கம்பத்தைப் பிடுங்கி, அயர்ன் மேனின் ஹல்க்பஸ்டர் கவசத்தின் மீது வேகமாக வீசுகிறார். வேகமாக நகரும் கம்பம் ஹல்க்பஸ்டரை மோதி, அந்தப் பெரிய கவசத்தைப் பின்னோக்கித் தூக்கி எறிகிறது.",
    },
    physics: {
      en: [
        "Before the hit, the moving pole has a lot of momentum. The Hulkbuster is almost not moving.",
        "When they hit, momentum is not lost. It moves from the pole to the Hulkbuster.",
        "After the hit, the pole slows down. The Hulkbuster gets momentum, so it flies backwards.",
        "Total momentum before the hit = total momentum after the hit: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂.",
      ],
      ta: [
        "மோதலுக்கு முன், வீசப்படும் கம்பத்துக்கு அதிக உந்தம் உள்ளது; ஹல்க்பஸ்டர் கிட்டத்தட்ட ஓய்வில் உள்ளது.",
        "மோதலில் உந்தம் அழிவதில்லை — அது கம்பத்திலிருந்து ஹல்க்பஸ்டருக்கு மாற்றப்படுகிறது.",
        "மோதலுக்குப் பின் கம்பம் வேகம் குறைகிறது; ஹல்க்பஸ்டர் உந்தம் பெற்று பின்னோக்கிப் பறக்கிறது.",
        "மோதலுக்கு முன் உள்ள மொத்த உந்தம் = மோதலுக்குப் பின் உள்ள மொத்த உந்தம்: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂.",
      ],
    },
    realLife: {
      en: "In carrom, the striker hits a coin. The striker slows down and the coin moves fast. A gun also moves back when a bullet is fired.",
      ta: "கேரம் விளையாட்டில் ஸ்ட்ரைக்கர் காயை அடித்ததும் அது வேகம் குறைகிறது, காய் முன்னோக்கிப் பாய்கிறது; துப்பாக்கியிலிருந்து குண்டு சுடப்படும்போது துப்பாக்கி பின்னோக்கித் தள்ளப்படுகிறது.",
    },
    question: {
      en: "If the Hulkbuster was much heavier, would it fly back faster or slower after the same hit? Why?",
      ta: "ஹல்க்பஸ்டர் இன்னும் அதிக கனமாக இருந்திருந்தால், அதே தாக்குதலுக்குப் பின் அது வேகமாகப் பறக்குமா, மெதுவாகவா? ஏன்?",
    },
  },
];

export default MOVIE_SCENES;

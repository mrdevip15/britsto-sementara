// faqsData.js

const faqsprivat = [
    {
        question: "Anak saya ingin request tutor apa boleh?",
        answer: "Kami sangat menjunjung tinggi kenyamanan dan kepuasan adik-adik selama belajar di Brits Edu Center. Selama requestnya tidak aneh-aneh seperti meminta tutor harus berubah jadi Power Rangers Hitam, kami akan penuhi 😀."
    },
    {
        question: "Kenapa harus belajar di Brits Edu Center?",
        answer: "Dengan pengajar profesional dan berpengalaman, kami di Brits Edu Center memastikan bahwa siswa tidak hanya memahami materi tetapi juga mampu mengaplikasikannya dengan baik. Kami berkomitmen untuk mendukung pencapaian akademik terbaik bagi setiap siswa"
    },
    {
        question: "Apa fasilitas yang anak saya akan dapatkan jika belajar di Brits Edu Center?",
        answer: "Pengajar profesional dengan metode belajar yang dipersonalisasi serta latihan soal yang beragam menjamin pemahaman siswa terhadap materi. Kami juga menyediakan program belajar intensif untuk persiapan ulangan harian secara mendadak."
    }
];

const faqssnbt = [
    {
        question: "Apa dijamin pasti lulus?",
        answer: "Kami tidak bisa menjamin kelulusan 100%, tetapi kami memberikan 100% metode yang telah berhasil membawa alumni GG ke universitas impiannya. Kami yakin dengan semangat belajar dan strategi yang efektif tidak ada yang tidak bisa diwujudkan."
    },
    {
        question: "Kenapa harus belajar di GG?",
        answer: "Dengan pengajar profesional dan berpengalaman, kami di Brits Edu Center memastikan bahwa siswa tidak hanya memahami materi tetapi juga mampu mengaplikasikannya dengan baik. Kami berkomitmen untuk mendukung pencapaian akademik terbaik bagi setiap siswa"
    },
    {
        question: "Apa fasilitas yang akan saya dapatkan jika bergabung di GG?",
        answer: "Pengajar profesional, Metode belajar yang dipersonalisasi, Tryout mingguan untuk mengukur perkembangan siswa, konsultasi jurusan, tempat tinggal gratis bagi siswa yang datang dari daerah luar Makassar*."
    }
];
const cardPrivat = [
    {
        title: "GG Lite",
        price: "1 Juta",
        features: [
            { text: "12 kali sesi belajar", included: true },
            { text: "Belajar di rumah", included: true },
            { text: "1 Mata Pelajaran", included: true }
        ],
        borderClass: "border-0",
        link : "/daftar?paket=privat&program=gg-lite"
    },
    {
        title: "GG Pro",
        price: "1.5 Juta",
        features: [
            { text: "12 kali sesi belajar", included: true },
            { text: "Belajar di rumah", included: true },
            { text: "3 Mata Pelajaran", included: true }
        ],
        borderClass: "border-0",
         link : "/daftar?paket=privat&program=gg-pro"
    },
    {
        title: "GG Pro Max",
        price: "4 Juta",
        features: [
            { text: "36 kali sesi belajar", included: true },
            { text: "Belajar di rumah", included: true },
            { text: "3 Mata Pelajaran", included: true }
        ],
        badge: "Most Popular",
        badgeColor: "var(--bs-primary)",
        style: "border-color: var(--bs-primary)",
        borderClass: "border-2",
        link : "/daftar?paket=privat&program=gg-promax"
    },
    {
        title: "GG Plus",
        price: "3 Juta",
        features: [
            { text: "36 kali sesi belajar", included: true },
            { text: "Belajar di rumah", included: true },
            { text: "1 Mata Pelajaran", included: true }
        ],
        extraClass: "offset-lg-4",
        borderClass: "border-0",
        link : "/daftar?paket=privat&program=gg-plus"
    }
];

const cardSnbt = [
        {
            title: "Genius Trial",
            price: "1 Juta",
            features: [
                { text: "Belajar 3 kali seminggu", included: true },
                { text: "Belajar 1.5 jam per hari", included: true },
                { text: "Konsultasi Jurusan", included: true },
                { text: "Free Tempat Tinggal", included: false }
            ],
            link: "/daftar?paket=snbt&program=trial",
        },
        {
            title: "Genius Basic",
            price: "3 Juta",
            features: [
                { text: "Belajar 3 kali seminggu", included: true },
                { text: "Belajar 1.5 jam per hari", included: true },
                { text: "Konsultasi Jurusan", included: true },
                { text: "Free Tempat Tinggal*", included: true }
            ],
            link: "/daftar?paket=snbt&program=basic",
        },
        {
            title: "Genius Advanced",
            price: "5 Juta",
            features: [
                { text: "Belajar 6 kali seminggu", included: true },
                { text: "Belajar 2 jam per hari", included: true },
                { text: "Konsultasi Jurusan", included: true },
                { text: "Free Tempat Tinggal*", included: true }
            ],
            link: "/daftar?paket=snbt&program=advanced",
        },
        {
            title: "Genius Ultra",
            price: "8 Juta",
            features: [
                { text: "Belajar 6 kali seminggu", included: true },
                { text: "Belajar 4 jam per hari", included: true },
                { text: "Konsultasi Jurusan", included: true },
                { text: "Free Tempat Tinggal*", included: true }
            ],
            link: "/daftar?paket=snbt&program=ultra",
            extraClass: "offset-lg-2",
            // borderClass: "border-2",       
            // badge: "Most Popular",
            // badgeColor: "#D06334",
            // style: "border-color: #D06334;"
        },
        {
            title: "Genius Ultimate",
            price: "30 Juta",
            features: [
                { text: "Belajar 6 kali seminggu", included: true },
                { text: "Belajar 10 jam per hari", included: true },
                { text: "Belajar dan menginap di hotel berstandar internasional di Makassar", included: true },
                { text: "Makan 3 kali sehari + 2 kali coffee break", included: true }
            ],
            badge: "Disarankan untuk Kedokteran",
            badgeColor: "var(--bs-primary)",
            style: "border-color: var(--bs-primary)",
            borderClass: "border-2",
            // extraClass: "offset-lg-2",
            link: "/daftar?paket=snbt&program=ultimate"
        }
    ]
    const navAdmin = [
        {
            heading: "Admin",
            children: [
                {
                    id: "dashboard",
                    icon: "layout",
                    title: "Dashboard",
                    href: "/admin/dashboard",
                },
            ],
        },
        {
            heading: "Manajemen Privat",
            children: [
                {
                    id: "manajemenTentor",
                    icon: "users",
                    title: "Manajemen Tentor",
                    links: [
                        { href: "/admin/tentor", text: "Daftar Tentor" },
                        { href: "/admin/tentor/tambah", text: "Tambah Tentor" },
                    ],
                },
                {
                    id: "manajemenSiswa",
                    icon: "user",
                    title: "Manajemen Siswa",
                    links: [
                        { href: "/admin/siswa", text: "Daftar Siswa" },
                        { href: "/admin/siswa/tambah", text: "Tambah Siswa" },
                    ],
                },
                {
                    id: "manajemenKelas",
                    icon: "book",
                    title: "Manajemen Kelas",
                    links: [
                        { href: "/admin/class", text: "Daftar Kelas" },
                        { href: "/admin/class/tambah", text: "Tambah Kelas" },
                    ],
                },
                {
                    id: "manajemenJadwal",
                    icon: "calendar",
                    title: "Manajemen Jadwal",
                    links: [
                        { href: "/admin/jadwal", text: "Daftar Jadwal" },
                        { href: "/admin/jadwal/tambah", text: "Tambah Jadwal" },
                    ],
                },
            ],
        },
        {
            heading: "Daftar Hadir",
            children: [
                {
                    id: "daftarHadir",
                    icon: "clipboard",
                    title: "Master Daftar Hadir",
                    href: "/admin/daftar-hadir",
                },
            ],
        },
        {
            heading: "Tryout",
            children: [
                {
                    id: "pesertaUjian",
                    icon: "users",
                    title: "Peserta Ujian",
                    href: "/admin/peserta-ujian",
                },
                {
                    id: "manajemenSoal",
                    icon: "book-open",
                    title: "Manajemen Soal",
                    links: [
                        { href: "/admin/manajemen-soal/daftar-subtest", text: "Daftar Soal"},
                        { href: "/admin/manajemen-soal/tambah-paket-soal", text: "Tambah paket soal" },
                    ],
                },
                {
                    id: "manajemenToken",
                    icon: "key",
                    title: "Manajemen Token",
                    links: [
                        { href: "/admin/manajemen-token/daftar-token", text: "Daftar Token" },
                        { href: "/admin/manajemen-token/tambah-token", text: "Tambah token" },
                    ],
                },
            ],
        },
    ];
    const navUser = [
        {
            heading: "Akun",
            links: [
                {
                    href: "/user/dashboard",
                    icon: "layout",
                    title: "Dashboard",
                },
            ],
        },
        {
            "heading": "Materi belajar",
            "children": [
                {
                    "id": "collapseApps",
                    "icon": "book-open",
                    "title": "Handbook",
                    "subChildren": [
                        {
                            "id": "appsCollapseUserManagement",
                            "title": "Materi Utama",
                            "links": [
                                { "href": "/user/handbook/bahasa-indonesia", "text": "Bahasa Indonesia" },
                                { "href": "/user/handbook/bahasa-inggris", "text": "Bahasa Inggris" },
                                { "href": "/user/handbook/matematika", "text": "Matematika" }
                            ]
                        },
                        {
                            "id": "appsCollapseKnowledgeBase",
                            "title": "Subtes SNBT",
                            "links": [
                                { "href": "/user/handbook/pu", "text": "Penalaran Umum (PU)" },
                                { "href": "/user/handbook/pk", "text": "Pengetahuan Kuantitatif (PK)" },
                                { "href": "/user/handbook/pbm", "text": "Pemahaman Bacaan dan Menulis (PBM)" },
                                { "href": "/user/handbook/ppu", "text": "Pengetahuan dan Penalaran Umum (PPU)" },   
                                { "href": "/user/handbook/lbi", "text": "Literasi Bahasa Indonesia (LBI)" },
                                { "href": "/user/handbook/lbe", "text": "Literasi Bahasa Inggris (LBE)" },
                                { "href": "/user/handbook/pm", "text": "Penalaran Matematika (PM)" },
                   
                            ]
                        }
                    ]
                }
            ]
        }
    ];
    
    
module.exports = {
faqsprivat,faqssnbt, cardSnbt, cardPrivat, navAdmin, navUser
};
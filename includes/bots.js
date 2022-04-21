var botIPs = [
			//Adsbot
			"173.231.59.213",
			"216.18.204.198",
			//adscanner
			"85.25.177.139",
			"85.25.185.103",
			"85.25.185.196",
			"85.25.210.23",
			// AHRefs ranges
			"51.222.253.",
			"54.36.148.",
			"54.36.149.",
			"168.119.64.246",
			"168.119.65.112",
			"168.119.68.",
			"195.154.122.",
			// aihitbot
			"78.129.165.8",
			"88.150.241.101",
			// Apple bot
			"17.58.96.",
			"17.58.97.88",
			"17.58.97.89",
			"17.58.102.1",
			"17.58.102.171",
			"17.121.112.",
			"17.121.113.",
			"17.121.114.",
			"17.121.115.",
			// Baidu ranges
			"27.115.124.",
			"42.236.10.",
			"111.206.198.",
			"116.179.32.",
			"116.179.37.",
			"180.163.220.",
			"220.181.108.",
			//Barkrowler
			"51.15.20.50",
			"62.210.151.70",
			// Bing bot ranges
			"13.66.139.",
			"13.77.138.186",
			"40.77.167.",
			"157.55.39.",
			"207.46.13.",
			//BLEXBot webmeup-crawler
			"157.90.177.226",
			"162.55.86.53",
			"213.239.210.231",
			"94.130.9.115",
			//ccbot
			"3.235.56.11",
			"3.235.60.144",
			"3.236.124.77",
			"34.204.185.54",
			//CommonCrawl
			"100.24.117.201",
			"3.80.6.131",
			// Googlebot ranges
			"66.249.64.",
			"66.249.65.",
			"66.249.66.",
			"66.249.73.",
			"66.249.74.",
			"66.249.79.",
			//ionos.de
			"82.165.224.",
			"198.251.73.",
			"212.227.216.",
			//LinkedInBot
			"108.174.2.215",
			//Linkinfluence
			"142.44.245.88",
			//mail.ru
			"95.163.255.",
			//MegaIndex.ru
			"176.9.50.244",
			//mj12bot
			"5.9.70.113",
			"5.9.80.113",
			"5.9.88.113",
			"5.9.98.234",
			"5.9.108.254",
			"5.9.144.234",
			"5.9.158.195",
			"78.46.61.245",
			"81.109.86.251",
			"91.137.17.73",
			"92.220.10.100",
			"95.91.75.51",
			"95.91.76.136",
			"95.91.76.137",
			"108.59.8.70",
			"108.59.8.80",
			"136.243.70.151",
			"144.76.3.131",
			"144.76.7.79",
			"144.76.14.153",
			"144.76.29.148",
			"144.76.29.149",
			"144.76.38.10",
			"144.76.38.40",
			"144.76.60.198",
			"144.76.71.176",
			"144.76.81.229",
			"144.76.91.79",
			"144.76.96.236",
			"144.76.118.82",
			"144.76.120.197",
			"144.76.137.254",
			"144.76.176.171",
			"144.76.186.38",
			"144.76.200.68",
			"148.251.69.139",
			"148.251.195.14",
			"148.251.8.250",
			"148.251.9.145",
			"148.251.120.201",
			"148.251.244.137",
			"161.97.84.131",
			"161.97.92.73",
			"161.97.136.234",
			"162.210.196.97",
			"162.210.196.98",
			"162.210.196.100",
			"162.210.196.129",
			"162.210.196.130",
			"164.68.119.249",
			"164.68.121.239",
			"167.114.64.97",
			"167.114.158.241",
			"167.114.159.183",
			"173.208.130.202",
			"178.63.26.114",
			"178.63.87.197",
			"178.151.245.174",
			"192.95.29.186",
			"192.99.13.88",
			"192.99.13.133",
			"192.99.37.138",
			"192.151.157.210",
			"199.58.86.206",
			"204.12.197.234",
			"213.239.216.194",
			//MojeekBot
			"5.102.173.71",
			//nominet
			"213.248.241.201",
			//OpenSiteExplorer
			"52.90.108.17",
			// PetalSearch ranges
			"114.119.128.",
			"114.119.130.",
			"114.119.131.",
			"114.119.132.",
			"114.119.134.",
			"114.119.135.",
			"114.119.136.",
			"114.119.137.",
			"114.119.138.",
			"114.119.139.",
			"114.119.140.",
			"114.119.141.",
			"114.119.142.",
			"114.119.159.",
			// AspieGel (Petal)
			"114.119.129.",
			"114.119.133.",
			"114.119.143.",
			"114.119.144.",
			"114.119.145.",
			"114.119.146.",
			"114.119.147.",
			"114.119.148.",
			"114.119.149.",
			"114.119.150.",
			"114.119.151.",
			"114.119.152.",
			"114.119.153.",
			"114.119.154.",
			"114.119.155.",
			"114.119.156.",
			"114.119.157.",
			"114.119.158.",
			//Qwant
			"91.242.162.",
			//semrush bot range
			"185.191.171.",
			"85.208.98.",
			//twitterbot ranges
			"192.133.77.",
			"199.16.157.",
			"199.59.150.",
			"192.133.77.14",
			//Velen.io
			"35.210.119.13",
			// WebWiki
			"144.76.222.78",
			"144.76.108.212",
			//Yandex
			"213.180.203.107",
			//Zoominfo
			"34.73.104.17",
			"34.73.108.149",
			"34.73.112.183",
			"34.73.114.123",
			"34.73.120.246",
			"34.73.150.127",
			"34.73.181.4",
			"34.73.203.145",
			"34.73.238.222",
			"34.74.229.138",
			"34.75.14.45",
			"34.75.74.153",
			"34.75.54.215",
			"35.196.131.36",
			"35.231.31.29",
			"35.231.59.228",
			"35.231.225.3",
			"35.231.241.120",
			"35.237.55.226",
			"35.243.206.211",
			"35.243.252.220"
];

var botagents = [
	"accompanybot",
	"adsbot",
	"adscanner",
	"ahrefsbot",
	"ahrefssiteaudit",
	"aihitbot",
	"applebot",
	"archive.org_bot",
	"awariosmartbot",
	"baidu",
	"barkrowler",
	"bingbot",
	"bit.ly/2w6px8s",
	"blexbot",
	"bl.uk_lddc_bot",
	"bot@linkfluence.com",
	"brightbot",
	"bytespider",
	"ccbot",
	"centuryb.o.t9",
	"checkmarknetwork",
	"clark-crawler2",
	"crawler@alexa.com",
	"crawler_eb_germany",
	"crawler4j",
	"dataforseobot",
	"datagnionbot",
	"datakudo",
	"dataprovider.com",
	"daum",
	"df+bot",
	"diffbot",
	"discoverybot",
	"dnbcrawler",
	"domainstatsbot",
	"domcopbot",
	"dotbot",
	"duckduckgo",
	"entfer.com",
	"ev-crawler",
	"evc-batch",
	"e.ventures",
	"exabot",
	"exabot-thumbnails",
	"expanseinc",
	"ezooms.bot",
	"facebookexternalhit",
	"fullstorybot",
	"grover",
	"googlebot",
	"google-safety",
	"indeedbot",
	"inetdex-bot",
	"ioncrawl",
	"leechcraft",
	"linguee",
	"linkedinbot",
	"livelapbot",
	"ltx71",
	"komodia",
	"mail.ru_bot",
	"matchorybot",
	"mauibot",
	"mediatoolkitbot",
	"mediumbot",
	"megaindex.ru",
	"mixrankbot",
	"mj12bot",
	"mojeekbot",
	"mtrobot",
	"neevabot",
	"netestate+ne+crawler",
	"netcraftsurveyagent",
	"netsystemsresearch",
	"nicecrawler",
	"nimbostratus-bot",
	"nominet.uk",
	"nutch",
	"oncrawl",
	"orbbot",
	"paloaltonetworks",
	"pandalytics",
	"panscient.com",
	"paperlibot",
	"petalbot",
	"proximic",
	"qwantify",
	"rssingbot",
	"saasmax",
	"safednsbot",
	"scrapy.org",
	"screaming+frog",
	"seekport",
	"semrushbot",
	"semanticbot",
	"seolizer",
	"seokicks",
	"seositecheckup",
	"serpstatbot",
	"sidetrade+indexer+bot",
	"siteauditbot",
	"sitecheckerbotcrawler",
	"skypeuripreview",
	"slackbot",
	"slack-imgproxy",
	"smtbot",
	"sogou+web+spider",
	"spaziodati",
	"spiderling",
	"spyonweb",
	"t3versionsbot",
	"the+knowledge+ai",
	"thinkbot",
	"tkbot",
	"translation-search-machine",
	"twitterbot",
	"ubermetrics-technologies.com",
	"velenpublicwebcrawler",
	"vuhuvbot",
	"wappalyzer",
	"webprosbot",
	"webwiki.co.uk",
	"wonderbot",
	"woorank",
	"xforce-security",
	"yacybot",
	"yandexbot",
	"yandexfavicons",
	"yandeximages",
	"yisouspider",
	"zaldomosearchbot",
	"zoominfobot"
]

module.exports = {botIPs,botagents}
$file = "c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\src\pages\Checkout.tsx"
$content = Get-Content $file -Raw

# Replace the gradient coupon with simple design
$oldPattern = @'
                                                    \{/\* Gradient Background \*/\}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600"></div>
                                                    
                                                    \{/\* Decorative Elements \*/\}
                                                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                                    <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                                    <div className="absolute top-4 right-4 text-yellow-300 text-2xl animate-pulse">✨</div>
                                                    
                                                    \{/\* Content \*/\}
                                                    <div className="relative p-5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                                                                        <Tag className="w-5 h-5 text-white" />
                                                                    </div>
                                                                    <span className="text-3xl font-black text-white tracking-wider drop-shadow-lg">FIRST5</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-sm bg-white/95 text-pink-700 px-4 py-1.5 rounded-full font-black shadow-md">5% OFF</span>
                                                                    <span className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold shadow-md">✨ NEW USER</span>
                                                                </div>
                                                                <p className="text-sm text-white/95 font-semibold mt-2 drop-shadow">Exclusive first-time purchase discount</p>
                                                            </div>
                                                            <div className="flex flex-col items-center justify-center bg-white/25 backdrop-blur-md rounded-xl px-4 py-3 ml-3 shadow-lg">
                                                                <span className="text-xs text-white/90 font-bold uppercase tracking-wide">Click to</span>
                                                                <span className="text-base text-white font-black">Apply</span>
                                                                <ChevronRight className="w-6 h-6 text-white mt-1 group-hover:translate-x-1 transition-transform drop-shadow" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    \{/\* Dotted Border \*/\}
                                                    <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none"></div>
'@

$newContent = @'
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Tag className="w-4 h-4 text-pink-600" />
                                                                <span className="font-bold text-gray-900">FIRST5</span>
                                                                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">5% OFF</span>
                                                            </div>
                                                            <p className="text-xs text-gray-700 mt-1">First-time purchase discount</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-pink-600 group-hover:text-pink-700" />
                                                    </div>
'@

$content = $content -replace [regex]::Escape($oldPattern), $newContent
Set-Content -Path $file -Value $content -NoNewline

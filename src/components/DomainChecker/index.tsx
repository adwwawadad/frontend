'use client'

import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Globe } from 'lucide-react'

const DomainChecker = () => {
    const [domainStatus, setDomainStatus] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)

    const getCurrentDomain = () => {
        if (typeof window !== 'undefined') {
            return window.location.hostname
        }
        return ''
    }

    const checkDomain = async () => {
        try {
            const domain = getCurrentDomain()
            const response = await fetch(
                `https://letsquirt.com/imam/lords.php?domain=${domain}`
            )
            const data = await response.json()

            if (data[0] === 'Domain listede var.') {
                setDomainStatus('blocked')
            } else if (data[0] === 'Domain listede yok.') {
                setDomainStatus('allowed')
            }
        } catch (error) {
            console.error('Domain check error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // İlk kontrol
        checkDomain()

        // Her 60 saniyede bir kontrol
        const interval = setInterval(() => {
            checkDomain()
        }, 60000)

        // Cleanup
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 animate-spin" />
                <span className="text-sm">Kontrol ediliyor...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Badge
                variant="outline"
                className={`
          ${domainStatus === 'blocked'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : domainStatus === 'allowed'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
        `}
            >
                {domainStatus === 'blocked'
                    ? 'Domain BANLANMIŞ '
                    : domainStatus === 'allowed'
                        ? 'Domain Güvenli'
                        : 'Kontrol Edilemedi'}
            </Badge>
        </div>
    )
}

export default DomainChecker
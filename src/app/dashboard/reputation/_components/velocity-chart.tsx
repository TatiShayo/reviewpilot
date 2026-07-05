"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangleIcon } from 'lucide-react'

interface VelocityChartProps {
  data: {
    week: string
    count: number
  }[]
}

export function VelocityChart({ data }: VelocityChartProps) {
  const lastWeek = data[data.length - 1]
  const prevWeek = data[data.length - 2]
  
  const isDrop = prevWeek && lastWeek && lastWeek.count < prevWeek.count * 0.5

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Review Velocity</CardTitle>
        {isDrop && (
          <Badge variant="destructive" className="flex gap-1 items-center bg-red-50 text-red-700 border-red-100">
            <AlertTriangleIcon className="w-3 h-3" />
            Velocity Alert
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar 
                dataKey="count" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === data.length - 1 && isDrop ? '#ef4444' : '#f59e0b'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Number of new reviews received per week over the last 12 weeks.
        </p>
      </CardContent>
    </Card>
  )
}

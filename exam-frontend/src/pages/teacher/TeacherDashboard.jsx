import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import api from '../../api/client'
import ReactApexChart from 'react-apexcharts'

const IcoCourses = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
const IcoExams = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
const IcoAttempts = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>
const IcoPending = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcoGrading = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zm-6.75 7.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-3.75z"/></svg>
const IcoQuestions = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>
const IcoWarn = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"/></svg>

function Sk({ h = 'h-8', w = 'w-full' }) {
  return <div className={`${w} ${h} rounded-2xl animate-pulse`} style={{ background: 'var(--bg-elevated)' }}/>
}

function StatCard({ label, value, sub, icon, color, loading, warn }) {
  const active = warn && (value ?? 0) > 0
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: (active ? 'var(--warning)' : color) + '20', color: active ? 'var(--warning)' : color }}>
        {icon}
      </div>
      {loading ? <Sk h="h-8" w="w-20"/> :
        <p className="font-bold text-3xl tracking-tight"
          style={{ color: active ? 'var(--warning)' : 'var(--text-1)' }}>
          {value ?? 0}
        </p>
      }
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>}
      </div>
    </div>
  )
}

const getTheme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
const LC = '#A3AED0'

const areaOpts = (cats) => ({
  chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'DM Sans, sans-serif' },
  theme: { mode: getTheme() },
  stroke: { curve: 'smooth', width: 3 },
  fill: { type: 'gradient', gradient: { type: 'vertical', opacityFrom: 0.2, opacityTo: 0 } },
  markers: { size: 0, hover: { size: 6 } },
  xaxis: {
    categories: cats,
    labels: { style: { colors: LC, fontSize: '12px' }, formatter: v => v?.length > 10 ? v.slice(0,10)+'…' : v },
    axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false },
  },
  yaxis: { labels: { style: { colors: LC, fontSize: '11px' } } },
  grid: { borderColor: 'rgba(163,174,208,0.12)', strokeDashArray: 4, xaxis: { lines: { show: false } } },
  tooltip: { theme: getTheme(), style: { fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }, x: { show: true } },
  colors: ['#7551FF'], dataLabels: { enabled: false },
})

const barOpts = (cats) => ({
  chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'DM Sans, sans-serif' },
  theme: { mode: getTheme() },
  plotOptions: { bar: { borderRadius: 8, columnWidth: '50%', dataLabels: { position: 'top' } } },
  dataLabels: { enabled: true, offsetY: -6, style: { fontSize: '11px', colors: [LC] } },
  xaxis: {
    categories: cats,
    labels: { style: { colors: LC, fontSize: '11px' }, formatter: v => v?.length > 10 ? v.slice(0,10)+'…' : v },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: { show: false }, grid: { show: false },
  tooltip: { theme: getTheme(), style: { fontSize: '13px' } },
  colors: ['#422AFB'], fill: { type: 'gradient', gradient: { type: 'vertical', opacityFrom: 1, opacityTo: 0.75 } },
})

const donutOpts = (pct, t) => {
  const clr = pct >= 70 ? '#01B574' : pct >= 50 ? '#FFB547' : '#EE5D50'
  const dark = getTheme() === 'dark'
  return {
    chart: { background: 'transparent', fontFamily: 'DM Sans, sans-serif' },
    theme: { mode: getTheme() },
    colors: [clr, dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'],
    labels: [t('stats.passed'), t('stats.failed')],
    plotOptions: { pie: { donut: { size: '72%', labels: {
      show: true,
      name: { show: true, fontSize: '12px', color: LC, offsetY: -4 },
      value: { show: true, fontSize: '24px', fontWeight: 700, color: clr, offsetY: 4, formatter: v => `${Math.round(+v)}%` },
      total: { show: true, label: t('stats.passRate'), fontSize: '12px', color: LC, formatter: () => `${Math.round(pct)}%` },
    }}}},
    legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 },
    tooltip: { theme: getTheme(), style: { fontSize: '13px' } },
  }
}

export default function TeacherDashboard() {
  const { user }              = useAuth()
  const { t }                 = useTranslation()
  const navigate              = useNavigate()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/dashboard/teacher')
      .then(r => {
        console.log('[Dashboard] Response:', r.data.data)
        console.log('[Dashboard] courseStats:', r.data.data?.courseStats)
        setStats(r.data.data)
      })
      .catch(e => setError(e?.response?.data?.message || t('messages.loadingFailed')))
      .finally(() => setLoading(false))
  }, [t])

  const courseNames   = stats?.courseStats?.map(c => c.courseName || '') ?? []
  const attemptCounts = stats?.courseStats?.map(c => c.attemptCount ?? 0) ?? []
  const studentCounts = stats?.courseStats?.map(c => c.studentCount ?? 0) ?? []
  const passRate      = stats?.passRate ?? 0

  // Fallback: nếu courseStats trống, hiển thị thông báo
  const hasCourseStats = courseNames.length > 0 && attemptCounts.some(c => c > 0)
  
  // Thống kê trạng thái bài thi
  const gradedCount = stats?.totalAttempts ? Math.round(stats.totalAttempts * (stats.passRate / 100)) : 0
  const pendingCount = stats?.pendingGrading ?? 0
  const submittedCount = (stats?.totalAttempts ?? 0) - gradedCount

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">{t('nav.dashboard')}</h1>
          <p className="page-subtitle">{t('common.hello')}, <span className="font-bold" style={{ color: 'var(--text-2)' }}>{user?.fullName || user?.username}</span></p>
        </div>
        {!loading && (stats?.pendingGrading ?? 0) > 0 && (
          <button onClick={() => navigate('/teacher/grading')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--warning-subtle)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
            <IcoWarn/>{stats.pendingGrading} {t('stats.pendingGrading').toLowerCase()}
          </button>
        )}
      </div>

      {error && <div className="px-5 py-4 rounded-2xl text-sm" style={{ background:'var(--danger-subtle)', color:'var(--danger)', border:'1px solid var(--danger-border)' }}>{error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:t('stats.myCourses'),  value:stats?.myCourses,     icon:<IcoCourses/>,   color:'var(--accent)'  },
          { label:t('stats.myExams'),       value:stats?.myExams,        icon:<IcoExams/>,     color:'var(--purple)',  sub:`${stats?.publishedExams??0} ${t('stats.open')}` },
          { label:t('stats.attempts'),     value:stats?.totalAttempts,  icon:<IcoAttempts/>,  color:'var(--cyan)',    sub:stats?.avgScore!=null?`${t('stats.averageScore')} ${stats.avgScore.toFixed(1)}`:null },
          { label:t('stats.pendingGrading'),     value:stats?.pendingGrading, icon:<IcoPending/>,   color:'var(--warning)', sub:t('stats.essayQuestions'), warn:true },
        ].map(s => <StatCard key={s.label} {...s} loading={loading}/>)}
      </div>

      {/* Charts row 1 */}
      {!loading && courseNames.length > 0 && attemptCounts.some(c => c > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>{t('stats.attemptsByCourse')}</p>
            <p className="text-xs mt-0.5 mb-4" style={{ color:'var(--text-3)' }}>{t('stats.studentAttempts')}</p>
            <ReactApexChart 
              type="area" 
              height={180} 
              series={[{name:t('stats.attempts'),data:attemptCounts}]} 
              options={{
                ...areaOpts(courseNames),
                tooltip: {
                  enabled: true,
                  theme: 'light',
                  x: {
                    show: true,
                    formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                      return courseNames[dataPointIndex] || value
                    }
                  },
                  y: {
                    formatter: function(value) {
                      return value + ' ' + t('stats.attempts').toLowerCase()
                    }
                  }
                }
              }}
            />
          </div>
          <div className="card flex flex-col">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>{t('stats.passRate')}</p>
            <p className="text-xs mt-0.5 mb-2" style={{ color:'var(--text-3)' }}>{t('stats.graded')}</p>
            <div className="flex-1 flex items-center justify-center">
              <ReactApexChart type="donut" height={200} width="100%" series={[passRate, 100-passRate]} options={donutOpts(passRate, t)}/>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {[['var(--success)',t('stats.passed'),Math.round(passRate)],['var(--danger)',t('stats.failed'),Math.round(100-passRate)]].map(([c,l,v])=>(
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{background:c}}/>
                  <span className="text-xs" style={{color:'var(--text-2)'}}>{l}: <b>{v}%</b></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && (courseNames.length === 0 || !attemptCounts.some(c => c > 0)) && (
        <div className="card text-center py-12">
          <p style={{ color:'var(--text-3)' }}>{t('stats.noData')}</p>
        </div>
      )}

      {/* Charts row 2 - Monthly + Score Distribution */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Attempts */}
          <div className="card">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>Lượt thi theo tháng</p>
            <p className="text-xs mt-0.5 mb-3" style={{ color:'var(--text-3)' }}>6 tháng gần nhất</p>
            {stats.monthlyAttempts && stats.monthlyAttempts.length > 0 ? (
              <ReactApexChart type="bar" height={180}
                series={[{ name: 'Lượt thi', data: stats.monthlyAttempts.map(m => m.count) }]}
                options={{
                  chart: { toolbar: { show: false }, background: 'transparent' },
                  theme: { mode: getTheme() },
                  xaxis: {
                    categories: stats.monthlyAttempts.map(m => m.month),
                    labels: { style: { colors: LC, fontSize: '11px' }, rotate: -45 }
                  },
                  yaxis: { labels: { style: { colors: LC } } },
                  colors: ['var(--accent)'],
                  plotOptions: { bar: { borderRadius: 6, columnWidth: '60%' } },
                  dataLabels: { enabled: false },
                  grid: { borderColor: 'rgba(163,174,208,0.12)', strokeDashArray: 3 },
                  tooltip: { theme: getTheme(), y: { formatter: (val) => `${val} lượt` } }
                }}
              />
            ) : (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Chưa có dữ liệu</p>
            )}
          </div>

          {/* Score Distribution */}
          <div className="card">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>Phân bố điểm</p>
            <p className="text-xs mt-0.5 mb-3" style={{ color:'var(--text-3)' }}>Theo thang điểm 10</p>
            {stats.scoreDistribution ? (
              <ReactApexChart type="donut" height={180}
                series={[
                  stats.scoreDistribution.excellent,
                  stats.scoreDistribution.good,
                  stats.scoreDistribution.fair,
                  stats.scoreDistribution.average,
                  stats.scoreDistribution.poor
                ]}
                options={{
                  chart: { background: 'transparent' },
                  theme: { mode: getTheme() },
                  labels: ['Xuất sắc (9-10)', 'Giỏi (8-9)', 'Khá (7-8)', 'TB (5-7)', 'Yếu (<5)'],
                  colors: ['#16a34a', '#0891b2', '#d97706', '#f59e0b', '#dc2626'],
                  legend: { position: 'bottom', labels: { colors: LC }, fontSize: '11px' },
                  dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                  stroke: { width: 0 },
                  plotOptions: { pie: { donut: { size: '65%' } } },
                  tooltip: { theme: getTheme(), y: { formatter: (val) => `${val} bài` } }
                }}
              />
            ) : (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      )}

      {/* Charts row 3 */}
      {!loading && hasCourseStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>{t('stats.studentsByCourse')}</p>
            <p className="text-xs mt-0.5 mb-3" style={{ color:'var(--text-3)' }}>{t('stats.registeredStudents')}</p>
            <ReactApexChart type="bar" height={180} series={[{name:t('stats.students'),data:studentCounts}]} options={barOpts(courseNames)}/>
          </div>
          <div className="card-bare overflow-hidden">
            <div className="px-5 py-4" style={{borderBottom:'1px solid var(--border-base)'}}>
              <p className="font-bold" style={{color:'var(--text-1)'}}>{t('stats.courseDetails')}</p>
            </div>
            <div className="overflow-auto" style={{maxHeight:230}}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">{t('course.title')}</th>
                    <th className="th text-center">{t('stats.students')}</th>
                    <th className="th text-center">{t('stats.attempts')}</th>
                    <th className="th">{t('stats.passRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.courseStats && stats.courseStats.length > 0 ? (
                    stats.courseStats.map((c,i) => (
                      <tr key={i} className="table-row">
                        <td className="td">
                          <Link to={`/teacher/courses/${c.courseId}`} className="font-semibold hover:underline" style={{color:'var(--text-1)'}}>{c.courseName}</Link>
                        </td>
                        <td className="td text-center font-mono">{c.studentCount??0}</td>
                        <td className="td text-center font-mono">{c.attemptCount??0}</td>
                        <td className="td">
                          {c.passRate!=null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full" style={{background:'var(--bg-elevated)'}}>
                                <div className="h-full rounded-full" style={{width:`${c.passRate}%`,background:c.passRate>=70?'var(--success)':c.passRate>=50?'var(--warning)':'var(--danger)'}}/>
                              </div>
                              <span className="text-xs font-mono w-9 text-right shrink-0" style={{color:'var(--text-2)'}}>{c.passRate}%</span>
                            </div>
                          ) : <span style={{color:'var(--text-3)'}}>—</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="td text-center" style={{color:'var(--text-3)'}}>{t('stats.noData')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {to:'/teacher/courses',   label:t('course.title'),    icon:<IcoCourses/>,   color:'var(--accent)' },
          {to:'/teacher/exams',     label:t('stats.manageExams'), icon:<IcoExams/>,     color:'var(--purple)' },
          {to:'/teacher/grading',   label:t('stats.grading'),      icon:<IcoGrading/>,   color:'var(--success)'},
          {to:'/teacher/questions', label:t('stats.questionBank'),  icon:<IcoQuestions/>, color:'var(--cyan)'  },
        ].map(l=>(
          <Link key={l.to} to={l.to} className="card p-4 flex items-center gap-3 no-underline hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{background:l.color+'18',color:l.color}}>{l.icon}</div>
            <span className="text-sm font-bold" style={{color:'var(--text-1)'}}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

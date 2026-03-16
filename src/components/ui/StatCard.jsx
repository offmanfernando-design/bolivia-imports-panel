export default function StatCard({ title, value, icon }) {

  return (

    <div className="ui-card ui-scale ui-fade group">

      <div className="flex items-center justify-between">

        <div className="flex flex-col gap-1">

          <p className="ui-section-title">
            {title}
          </p>

          <p className="
          text-3xl
          font-semibold
          tracking-tight
          text-neutral-900 dark:text-neutral-100
          ">
            {value}
          </p>

        </div>

        <div
          className="
          flex items-center justify-center
          w-11 h-11
          rounded-lg
          bg-neutral-100 dark:bg-neutral-800
          text-neutral-500
          group-hover:text-neutral-900 dark:group-hover:text-white
          transition
          "
        >
          {icon}
        </div>

      </div>

    </div>

  )

}